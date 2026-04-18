package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

const (
	pollInterval    = 5 * time.Second
	batchSize       = 10
	maxRetries      = 3
	retryBackoff    = 2 * time.Second
	logProcessing   = "📧 Processing %d pending notifications"
	logSending      = "📤 Sending email to: %s (Notification ID: %s)"
	logSuccess      = "✅ Email sent successfully: %s"
	logFailed       = "❌ Email failed: %s - %v"
	logDBUpdate     = "📝 Updating notification status: %s"
	logDBError      = "❌ Database error updating notification %s: %v"
	logWorkerStart  = "🚀 Notification Worker started (polling every %v)"
	logWorkerStop   = "🛑 Notification Worker stopped"
	logBatchSent    = "✅ Batch complete: %d sent, %d failed"
)

type NotificationWorker struct {
	db      *pgxpool.Pool
	sgClient *sendgrid.Client
	fromEmail string
	retries map[string]int
}

func main() {
	// Load environment variables
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/intelli_reserve"
	}

	sgKey := os.Getenv("SENDGRID_API_KEY")
	if sgKey == "" {
		log.Fatal("❌ SENDGRID_API_KEY environment variable is required")
	}

	fromEmail := os.Getenv("FROM_EMAIL")
	if fromEmail == "" {
		fromEmail = "noreply@intellireserve.com"
	}

	// Connect to database
	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	defer pool.Close()

	log.Printf("✅ Connected to PostgreSQL database")

	// Create worker
	worker := &NotificationWorker{
		db:        pool,
		sgClient:  sendgrid.NewSendClient(sgKey),
		fromEmail: fromEmail,
		retries:   make(map[string]int),
	}

	log.Printf(logWorkerStart, pollInterval)

	// Start polling loop
	ticker := time.NewTicker(pollInterval)
	defer ticker.Stop()

	// Also process immediately on startup
	if err := worker.processPendingNotifications(context.Background()); err != nil {
		log.Printf("❌ Error processing notifications on startup: %v", err)
	}

	// Poll for pending notifications
	for range ticker.C {
		if err := worker.processPendingNotifications(context.Background()); err != nil {
			log.Printf("❌ Error processing notifications: %v", err)
		}
	}
}

// processPendingNotifications fetches and sends pending notifications
func (w *NotificationWorker) processPendingNotifications(ctx context.Context) error {
	notifications, err := w.fetchPendingNotifications(ctx)
	if err != nil {
		return err
	}

	if len(notifications) == 0 {
		return nil
	}

	log.Printf(logProcessing, len(notifications))
	sentCount, failedCount := w.sendBatch(ctx, notifications)
	log.Printf(logBatchSent, sentCount, failedCount)
	return nil
}

// fetchPendingNotifications retrieves pending email notifications from database
func (w *NotificationWorker) fetchPendingNotifications(ctx context.Context) ([]struct {
	id      string
	email   string
	subject string
	body    string
}, error) {
	query := `
		SELECT id, recipient_email, subject, body
		FROM notifications
		WHERE status = 'pending' AND channel = 'email'
		ORDER BY created_at ASC
		LIMIT $1
	`

	rows, err := w.db.Query(ctx, query, batchSize)
	if err != nil {
		return nil, fmt.Errorf("query error: %w", err)
	}
	defer rows.Close()

	var notifications []struct {
		id      string
		email   string
		subject string
		body    string
	}

	for rows.Next() {
		var id, email, subject, body string
		if err := rows.Scan(&id, &email, &subject, &body); err != nil {
			log.Printf("❌ Error scanning notification: %v", err)
			continue
		}
		notifications = append(notifications, struct {
			id      string
			email   string
			subject string
			body    string
		}{id, email, subject, body})
	}

	return notifications, nil
}

// sendBatch sends a batch of notifications and returns success/failure counts
func (w *NotificationWorker) sendBatch(ctx context.Context, notifications []struct {
	id      string
	email   string
	subject string
	body    string
}) (int, int) {
	sentCount := 0
	failedCount := 0

	for _, notif := range notifications {
		log.Printf(logSending, notif.email, notif.id)
		if w.processSingleNotification(ctx, notif.id, notif.email, notif.subject, notif.body) {
			sentCount++
		} else {
			failedCount++
		}
	}

	return sentCount, failedCount
}

// processSingleNotification handles sending and tracking a single notification
func (w *NotificationWorker) processSingleNotification(ctx context.Context, id, email, subject, body string) bool {
	if err := w.sendEmail(ctx, id, email, subject, body); err != nil {
		log.Printf(logFailed, id, err)
		w.retries[id]++

		if w.retries[id] >= maxRetries {
			if err := w.markNotificationFailed(ctx, id); err != nil {
				log.Printf(logDBError, id, err)
			}
			delete(w.retries, id)
		}
		return false
	}

	log.Printf(logSuccess, id)
	if err := w.markNotificationSent(ctx, id); err != nil {
		log.Printf(logDBError, id, err)
	}
	delete(w.retries, id)
	return true
}

// sendEmail sends an email via SendGrid
func (w *NotificationWorker) sendEmail(ctx context.Context, notifID, to, subject, body string) error {
	// Create email message
	from := mail.NewEmail("IntelliReserve", w.fromEmail)
	toEmail := mail.NewEmail("Recipient", to)

	message := mail.NewSingleEmail(from, subject, toEmail, body, body)
	message.SetReplyTo(mail.NewEmail("Support", "support@intellireserve.com"))

	// Add tracking for troubleshooting
	message.SetCustomArg("notification_id", notifID)
	message.SetCustomArg("timestamp", time.Now().UTC().Format(time.RFC3339))

	// Send email
	response, err := w.sgClient.SendWithContext(ctx, message)
	if err != nil {
		return fmt.Errorf("sendgrid client error: %w", err)
	}

	// Check response status
	if response.StatusCode >= 400 {
		return fmt.Errorf("sendgrid returned status %d: %s", response.StatusCode, response.Body)
	}

	return nil
}

// markNotificationSent updates the notification status to 'sent'
func (w *NotificationWorker) markNotificationSent(ctx context.Context, notifID string) error {
	log.Printf(logDBUpdate, notifID)

	query := `
		UPDATE notifications
		SET status = 'sent', sent_at = NOW(), updated_at = NOW()
		WHERE id = $1
	`

	_, err := w.db.Exec(ctx, query, notifID)
	if err != nil {
		return fmt.Errorf("failed to update notification status: %w", err)
	}

	return nil
}

// markNotificationFailed updates the notification status to 'failed'
func (w *NotificationWorker) markNotificationFailed(ctx context.Context, notifID string) error {
	query := `
		UPDATE notifications
		SET status = 'failed', failed_at = NOW(), updated_at = NOW()
		WHERE id = $1
	`

	_, err := w.db.Exec(ctx, query, notifID)
	if err != nil {
		return fmt.Errorf("failed to mark notification as failed: %w", err)
	}

	log.Printf("⚠️  Notification %s marked as failed after %d retries", notifID, maxRetries)
	return nil
}
