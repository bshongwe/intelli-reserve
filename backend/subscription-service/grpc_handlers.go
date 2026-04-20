package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5"
	"google.golang.org/protobuf/types/known/timestamppb"

	subscription "github.com/intelli-reserve/backend/gen/go/subscription"
)

const (
	trialDurationDays = 14
)

// SyncUserSubscriptions ensures all users have a valid subscription plan assigned
// This is called during data migration to assign Starter plan to existing users
func (s *SubscriptionServer) SyncUserSubscriptions(
	ctx context.Context,
	req *subscription.SyncUserSubscriptionsRequest,
) (*subscription.SyncUserSubscriptionsResponse, error) {
	log.Printf("Starting user subscription synchronization...")

	// Get starter plan ID
	var starterPlanID string
	err := s.db.QueryRow(ctx,
		"SELECT id FROM subscription_plans WHERE name = 'starter' LIMIT 1",
	).Scan(&starterPlanID)
	if err != nil {
		log.Printf("Failed to get starter plan: %v", err)
		return nil, fmt.Errorf("starter plan not found")
	}

	now := time.Now()

	// Update all users without a subscription plan
	result, err := s.db.Exec(ctx, `
		UPDATE users
		SET 
			subscription_plan_id = $1::uuid,
			subscription_status = 'starter',
			is_trial_used = false,
			subscription_started_at = $2,
			updated_at = $2
		WHERE subscription_plan_id IS NULL
	`, starterPlanID, now)

	if err != nil {
		log.Printf("Failed to sync user subscriptions: %v", err)
		return nil, fmt.Errorf("failed to sync subscriptions")
	}

	rowsAffected := result.RowsAffected()

	// Log sync transaction for each affected user
	if rowsAffected > 0 {
		_, err = s.db.Exec(ctx, `
			INSERT INTO subscription_transactions (user_id, subscription_plan_id, transaction_type, status, notes)
			SELECT 
				u.id,
				$1::uuid,
				'subscription_activated',
				'completed',
				'Starter plan assigned during sync'
			FROM users u
			WHERE u.subscription_status = 'starter' 
				AND u.is_trial_used = false
				AND u.subscription_plan_id = $1::uuid
				AND u.updated_at >= $2 - INTERVAL '1 minute'
				AND NOT EXISTS (
					SELECT 1 FROM subscription_transactions st
					WHERE st.user_id = u.id 
						AND st.transaction_type = 'subscription_activated'
				)
		`, starterPlanID, now)

		if err != nil {
			log.Printf("Failed to log sync transactions: %v", err)
			// Don't fail the whole operation if logging fails
		}
	}

	return &subscription.SyncUserSubscriptionsResponse{
		Success:      true,
		Message:      fmt.Sprintf("Successfully synced %d users to Starter plan", rowsAffected),
		UsersSynced:  rowsAffected,
		SyncedAt:     timestamppb.New(now),
	}, nil
}

// VerifySubscriptionConsistency checks that all users have valid subscriptions
func (s *SubscriptionServer) VerifySubscriptionConsistency(
	ctx context.Context,
	req *subscription.VerifySubscriptionConsistencyRequest,
) (*subscription.VerifySubscriptionConsistencyResponse, error) {
	log.Printf("Verifying subscription consistency...")

	// Find users without subscriptions
	var usersWithoutSub int32
	err := s.db.QueryRow(ctx,
		"SELECT COUNT(*) FROM users WHERE subscription_plan_id IS NULL",
	).Scan(&usersWithoutSub)
	if err != nil {
		log.Printf("Failed to check subscription consistency: %v", err)
		return nil, fmt.Errorf("failed to verify consistency")
	}

	// Find users with invalid subscription status
	var usersWithInvalidStatus int32
	err = s.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM users u
		WHERE subscription_plan_id IS NOT NULL 
			AND subscription_status NOT IN ('starter', 'professional', 'enterprise', 'trial_expired')
	`).Scan(&usersWithInvalidStatus)
	if err != nil {
		log.Printf("Failed to check invalid status: %v", err)
		return nil, fmt.Errorf("failed to verify consistency")
	}

	// Find users with orphaned trial dates
	var usersWithOrphanedTrials int32
	err = s.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM users u
		WHERE (trial_started_at IS NOT NULL OR trial_expires_at IS NOT NULL)
			AND is_trial_used = false
	`).Scan(&usersWithOrphanedTrials)
	if err != nil {
		log.Printf("Failed to check orphaned trials: %v", err)
		return nil, fmt.Errorf("failed to verify consistency")
	}

	isConsistent := usersWithoutSub == 0 && usersWithInvalidStatus == 0 && usersWithOrphanedTrials == 0

	return &subscription.VerifySubscriptionConsistencyResponse{
		IsConsistent:           isConsistent,
		UsersWithoutSubscription: usersWithoutSub,
		UsersWithInvalidStatus: usersWithInvalidStatus,
		UsersWithOrphanedTrials: usersWithOrphanedTrials,
		Message: fmt.Sprintf(
			"Consistency check: %d users without sub, %d with invalid status, %d with orphaned trials",
			usersWithoutSub, usersWithInvalidStatus, usersWithOrphanedTrials,
		),
	}, nil
}

// ActivateTrial starts a 14-day free trial for a user
func (s *SubscriptionServer) ActivateTrial(
	ctx context.Context,
	req *subscription.TrialActivationRequest,
) (*subscription.TrialActivationResponse, error) {
	if req.UserId == "" {
		return nil, fmt.Errorf("user_id is required")
	}

	// Get professional plan ID
	var professionalPlanID int32
	err := s.db.QueryRow(ctx,
		"SELECT id FROM subscription_plans WHERE name = 'professional' LIMIT 1",
	).Scan(&professionalPlanID)
	if err != nil {
		log.Printf("Failed to get professional plan: %v", err)
		return nil, fmt.Errorf("professional plan not found")
	}

	// Calculate trial expiration
	now := time.Now()
	trialExpiresAt := now.AddDate(0, 0, trialDurationDays)

	// Update user subscription
	_, err = s.db.Exec(ctx, `
		UPDATE users
		SET 
			subscription_plan_id = $1,
			subscription_status = 'professional',
			trial_started_at = $2,
			trial_expires_at = $3,
			is_trial_used = true,
			subscription_started_at = $2,
			updated_at = $2
		WHERE id = $4
	`, professionalPlanID, now, trialExpiresAt, req.UserId)

	if err != nil {
		log.Printf("Failed to activate trial for user %s: %v", req.UserId, err)
		return nil, fmt.Errorf("failed to activate trial")
	}

	// Log transaction
	_, err = s.db.Exec(ctx, `
		INSERT INTO subscription_transactions
		(user_id, plan_id, transaction_type, amount_cents, status, created_at)
		VALUES ($1, $2, 'trial_activated', 0, 'completed', $3)
	`, req.UserId, professionalPlanID, now)

	if err != nil {
		log.Printf("Failed to log trial activation: %v", err)
		// Don't fail the whole operation if logging fails
	}

	return &subscription.TrialActivationResponse{
		UserId:          req.UserId,
		SubscriptionStatus: "trial",
		TrialStartedAt: timestamppb.New(now),
		TrialExpiresAt: timestamppb.New(trialExpiresAt),
		Success:        true,
		ErrorMessage:   "",
	}, nil
}

// ActivateSubscription converts a trial or starter to paid subscription
func (s *SubscriptionServer) ActivateSubscription(
	ctx context.Context,
	req *subscription.SubscriptionActivationRequest,
) (*subscription.SubscriptionActivationResponse, error) {
	if req.UserId == "" {
		return nil, fmt.Errorf("user_id is required")
	}
	if req.PlanName == "" {
		return nil, fmt.Errorf("plan_name is required")
	}
	if req.PaymentReference == "" {
		return nil, fmt.Errorf("payment_reference is required")
	}

	now := time.Now()

	// Get plan ID from plan name
	var planID int32
	var monthlyPrice int32
	err := s.db.QueryRow(ctx,
		"SELECT id, monthly_price_cents FROM subscription_plans WHERE name = $1 LIMIT 1",
		req.PlanName,
	).Scan(&planID, &monthlyPrice)
	if err != nil {
		log.Printf("Failed to get plan %s: %v", req.PlanName, err)
		return nil, fmt.Errorf("plan not found")
	}

	// Calculate next billing date (30 days from now)
	nextBillingDate := now.AddDate(0, 0, 30)

	// Update user subscription
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction")
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		UPDATE users
		SET 
			subscription_plan_id = $1,
			subscription_status = $2,
			last_payment_date = $3,
			next_billing_date = $4,
			trial_started_at = NULL,
			trial_expires_at = NULL,
			is_trial_used = false,
			subscription_started_at = $3,
			updated_at = $3
		WHERE id = $5
	`, planID, "professional", now, nextBillingDate, req.UserId)

	if err != nil {
		log.Printf("Failed to update user subscription: %v", err)
		return nil, fmt.Errorf("failed to activate subscription")
	}

	// Log transaction
	_, err = tx.Exec(ctx, `
		INSERT INTO subscription_transactions
		(user_id, plan_id, transaction_type, amount_cents, payment_reference, status, created_at)
		VALUES ($1, $2, 'subscription_activated', $3, $4, 'completed', $5)
	`, req.UserId, planID, monthlyPrice, req.PaymentReference, now)

	if err != nil {
		log.Printf("Failed to log subscription activation: %v", err)
		return nil, fmt.Errorf("failed to log transaction")
	}

	// Commit transaction
	err = tx.Commit(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to commit transaction")
	}

	return &subscription.SubscriptionActivationResponse{
		UserId:                  req.UserId,
		SubscriptionStatus:      "active",
		SubscriptionStartedAt:   timestamppb.New(now),
		NextBillingDate:         timestamppb.New(nextBillingDate),
		Success:                 true,
		ErrorMessage:            "",
	}, nil
}

// GetSubscription retrieves current subscription info for a user
func (s *SubscriptionServer) GetSubscription(
	ctx context.Context,
	req *subscription.GetSubscriptionRequest,
) (*subscription.GetSubscriptionResponse, error) {
	if req.UserId == "" {
		return nil, fmt.Errorf("user_id is required")
	}

	var (
		planID              string
		planName            string
		subscriptionStatus  string
		trialStartedAt      *time.Time
		trialExpiresAt      *time.Time
		lastPaymentDate     *time.Time
		nextBillingDate     *time.Time
		isTrialUsed         bool
		monthlyPriceCents   int32
		daysRemaining       int32
		maxBookingsPerMonth int32
		hasDynamicPricing   bool
		hasPrioritySupport  bool
	)

	err := s.db.QueryRow(ctx, `
		SELECT 
			sp.id,
			sp.name,
			u.subscription_status,
			u.trial_started_at,
			u.trial_expires_at,
			u.last_payment_date,
			u.next_billing_date,
			u.is_trial_used,
			sp.monthly_price_cents,
			sp.max_bookings_per_month,
			sp.has_dynamic_pricing,
			sp.has_priority_support
		FROM users u
		JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
		WHERE u.id = $1
	`, req.UserId).Scan(
		&planID,
		&planName,
		&subscriptionStatus,
		&trialStartedAt,
		&trialExpiresAt,
		&lastPaymentDate,
		&nextBillingDate,
		&isTrialUsed,
		&monthlyPriceCents,
		&maxBookingsPerMonth,
		&hasDynamicPricing,
		&hasPrioritySupport,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			log.Printf("User not found: %s", req.UserId)
			return nil, fmt.Errorf("user not found")
		}
		log.Printf("Failed to get subscription for user %s: %v", req.UserId, err)
		return nil, fmt.Errorf("failed to get subscription")
	}

	// Calculate days remaining if on trial
	if trialExpiresAt != nil {
		daysRemaining = int32(time.Until(*trialExpiresAt).Hours() / 24)
		if daysRemaining < 0 {
			daysRemaining = 0
		}
	}

	resp := &subscription.GetSubscriptionResponse{
		UserId:             req.UserId,
		SubscriptionStatus: subscriptionStatus,
		IsTrialUsed:        isTrialUsed,
		Plan: &subscription.SubscriptionPlan{
			Id:                   planID,
			Name:                 planName,
			DisplayName:          planName,
			MonthlyPriceCents:    monthlyPriceCents,
			MaxBookingsPerMonth:  maxBookingsPerMonth,
			HasAdvancedAnalytics: true,
			HasDynamicPricing:    hasDynamicPricing,
			HasPrioritySupport:   hasPrioritySupport,
		},
	}

	if trialStartedAt != nil {
		resp.TrialStartedAt = timestamppb.New(*trialStartedAt)
	}
	if trialExpiresAt != nil {
		resp.TrialExpiresAt = timestamppb.New(*trialExpiresAt)
	}
	if lastPaymentDate != nil {
		resp.LastPaymentDate = timestamppb.New(*lastPaymentDate)
	}
	if nextBillingDate != nil {
		resp.NextBillingDate = timestamppb.New(*nextBillingDate)
	}

	return resp, nil
}

// CheckTrialExpiration runs auto-downgrade logic for expired trials
func (s *SubscriptionServer) CheckTrialExpiration(
	ctx context.Context,
	req *subscription.CheckTrialExpirationRequest,
) (*subscription.CheckTrialExpirationResponse, error) {
	now := time.Now()

	// Call PostgreSQL function to auto-downgrade expired trials
	var result string
	err := s.db.QueryRow(ctx,
		"SELECT auto_downgrade_expired_trials();",
	).Scan(&result)

	if err != nil {
		log.Printf("Failed to run auto_downgrade_expired_trials: %v", err)
		return nil, fmt.Errorf("failed to check trial expiration")
	}

	// Count how many trials were downgraded
	var downgradedCount int32
	err = s.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM subscription_transactions
		WHERE transaction_type = 'trial_downgraded'
		AND created_at > $1 - INTERVAL '1 minute'
	`, now).Scan(&downgradedCount)

	if err != nil {
		log.Printf("Failed to count downgrades: %v", err)
		downgradedCount = 0
	}

	return &subscription.CheckTrialExpirationResponse{
		DowngradedUsersCount: downgradedCount,
		Success:             true,
		ErrorMessage:        "",
	}, nil
}

// GetSubscriptionPlans returns all available subscription plans
func (s *SubscriptionServer) GetSubscriptionPlans(
	ctx context.Context,
	req *subscription.GetSubscriptionPlansRequest,
) (*subscription.GetSubscriptionPlansResponse, error) {
	rows, err := s.db.Query(ctx, `
		SELECT 
			id,
			name,
			display_name,
			description,
			monthly_price_cents,
			max_bookings_per_month,
			has_dynamic_pricing,
			has_priority_support
		FROM subscription_plans
		ORDER BY monthly_price_cents ASC
	`)
	if err != nil {
		log.Printf("Failed to get subscription plans: %v", err)
		return nil, fmt.Errorf("failed to get plans")
	}
	defer rows.Close()

	var plans []*subscription.SubscriptionPlan

	for rows.Next() {
		var (
			id                   string
			name                 string
			displayName          string
			description          *string
			monthlyPriceCents    int32
			maxBookingsPerMonth  *int32
			hasDynamicPricing    bool
			hasPrioritySupport   bool
		)

		err := rows.Scan(
			&id,
			&name,
			&displayName,
			&description,
			&monthlyPriceCents,
			&maxBookingsPerMonth,
			&hasDynamicPricing,
			&hasPrioritySupport,
		)
		if err != nil {
			log.Printf("Failed to scan plan: %v", err)
			continue
		}

		// Handle nullable fields
		desc := ""
		if description != nil {
			desc = *description
		}
		maxBookings := int32(0)
		if maxBookingsPerMonth != nil {
			maxBookings = *maxBookingsPerMonth
		}

		plan := &subscription.SubscriptionPlan{
			Id:                  id,
			Name:                name,
			DisplayName:         displayName,
			Description:         desc,
			MonthlyPriceCents:   monthlyPriceCents,
			MaxBookingsPerMonth: maxBookings,
			HasDynamicPricing:   hasDynamicPricing,
			HasPrioritySupport:  hasPrioritySupport,
		}

		plans = append(plans, plan)
	}

	if err := rows.Err(); err != nil {
		log.Printf("Error iterating plans: %v", err)
		return nil, fmt.Errorf("failed to read plans")
	}

	return &subscription.GetSubscriptionPlansResponse{
		Plans: plans,
	}, nil
}
