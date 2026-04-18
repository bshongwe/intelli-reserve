package repo

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/intelli-reserve/backend/inventory-service/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	errServiceNotFound   = "service not found"
	errTimeSlotNotFound  = "time slot not found"
)

// ServiceRepository handles database operations for services
type ServiceRepository struct {
	pool *pgxpool.Pool
}

// NewServiceRepository creates a new service repository
func NewServiceRepository(pool *pgxpool.Pool) *ServiceRepository {
	return &ServiceRepository{pool: pool}
}

// CreateService creates a new service
func (r *ServiceRepository) CreateService(ctx context.Context, service *models.Service) (*models.Service, error) {
	service.ID = uuid.New()
	service.CreatedAt = time.Now()
	service.UpdatedAt = time.Now()

	err := r.pool.QueryRow(ctx,
		`INSERT INTO services (id, host_id, name, description, category, duration_minutes, base_price, max_participants, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, host_id, name, description, category, duration_minutes, base_price, max_participants, is_active, created_at, updated_at`,
		service.ID, service.HostID, service.Name, service.Description, service.Category,
		service.DurationMinutes, service.BasePrice, service.MaxParticipants, service.IsActive,
		service.CreatedAt, service.UpdatedAt,
	).Scan(&service.ID, &service.HostID, &service.Name, &service.Description, &service.Category,
		&service.DurationMinutes, &service.BasePrice, &service.MaxParticipants, &service.IsActive,
		&service.CreatedAt, &service.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create service: %w", err)
	}

	return service, nil
}

// GetService retrieves a service by ID
func (r *ServiceRepository) GetService(ctx context.Context, id uuid.UUID) (*models.Service, error) {
	service := &models.Service{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, host_id, name, description, category, duration_minutes, base_price, max_participants, is_active, created_at, updated_at
		FROM services WHERE id = $1`,
		id,
	).Scan(&service.ID, &service.HostID, &service.Name, &service.Description, &service.Category,
		&service.DurationMinutes, &service.BasePrice, &service.MaxParticipants, &service.IsActive,
		&service.CreatedAt, &service.UpdatedAt)

	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get service: %w", err)
	}

	return service, nil
}

// GetServicesByHost retrieves all services for a host
func (r *ServiceRepository) GetServicesByHost(ctx context.Context, hostID uuid.UUID) ([]*models.Service, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, host_id, name, description, category, duration_minutes, base_price, max_participants, is_active, created_at, updated_at
		FROM services WHERE host_id = $1 ORDER BY created_at DESC`,
		hostID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get services: %w", err)
	}
	defer rows.Close()

	var services []*models.Service
	for rows.Next() {
		service := &models.Service{}
		if err := rows.Scan(&service.ID, &service.HostID, &service.Name, &service.Description, &service.Category,
			&service.DurationMinutes, &service.BasePrice, &service.MaxParticipants, &service.IsActive,
			&service.CreatedAt, &service.UpdatedAt); err != nil {
			return nil, err
		}
		services = append(services, service)
	}

	return services, nil
}

// UpdateService updates an existing service
func (r *ServiceRepository) UpdateService(ctx context.Context, service *models.Service) (*models.Service, error) {
	service.UpdatedAt = time.Now()

	_, err := r.pool.Exec(ctx,
		`UPDATE services SET name = $1, description = $2, category = $3, duration_minutes = $4, 
		base_price = $5, max_participants = $6, is_active = $7, updated_at = $8 WHERE id = $9`,
		service.Name, service.Description, service.Category, service.DurationMinutes,
		service.BasePrice, service.MaxParticipants, service.IsActive, service.UpdatedAt, service.ID,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to update service: %w", err)
	}

	return service, nil
}

// DeleteService deletes a service
func (r *ServiceRepository) DeleteService(ctx context.Context, id uuid.UUID) error {
	result, err := r.pool.Exec(ctx, `DELETE FROM services WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete service: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf(errServiceNotFound)
	}

	return nil
}

// TimeSlotRepository handles database operations for time slots
type TimeSlotRepository struct {
	pool *pgxpool.Pool
}

// NewTimeSlotRepository creates a new time slot repository
func NewTimeSlotRepository(pool *pgxpool.Pool) *TimeSlotRepository {
	return &TimeSlotRepository{pool: pool}
}

// CreateTimeSlot creates a new time slot
func (r *TimeSlotRepository) CreateTimeSlot(ctx context.Context, slot *models.TimeSlot) (*models.TimeSlot, error) {
	slot.ID = uuid.New()
	slot.CreatedAt = time.Now()
	slot.UpdatedAt = time.Now()

	err := r.pool.QueryRow(ctx,
		`INSERT INTO time_slots (id, service_id, slot_date, start_time, end_time, is_available, is_recurring, recurring_rule_id, booked_participants, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, service_id, slot_date, start_time, end_time, is_available, is_recurring, recurring_rule_id, booked_participants, created_at, updated_at`,
		slot.ID, slot.ServiceID, slot.SlotDate, slot.StartTime, slot.EndTime, slot.IsAvailable, slot.IsRecurring,
		slot.RecurringRuleID, slot.BookedCount, slot.CreatedAt, slot.UpdatedAt,
	).Scan(&slot.ID, &slot.ServiceID, &slot.SlotDate, &slot.StartTime, &slot.EndTime, &slot.IsAvailable, &slot.IsRecurring,
		&slot.RecurringRuleID, &slot.BookedCount, &slot.CreatedAt, &slot.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create time slot: %w", err)
	}

	return slot, nil
}

// GetTimeSlotsByService retrieves all time slots for a service on a specific date
func (r *TimeSlotRepository) GetTimeSlotsByService(ctx context.Context, serviceID uuid.UUID, date time.Time) ([]*models.TimeSlot, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, service_id, slot_date, start_time, end_time, is_available, is_recurring, recurring_rule_id, booked_participants, created_at, updated_at
		FROM time_slots WHERE service_id = $1 AND slot_date = $2 ORDER BY start_time`,
		serviceID, date,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get time slots: %w", err)
	}
	defer rows.Close()

	var slots []*models.TimeSlot
	for rows.Next() {
		slot := &models.TimeSlot{}
		if err := rows.Scan(&slot.ID, &slot.ServiceID, &slot.SlotDate, &slot.StartTime, &slot.EndTime,
			&slot.IsAvailable, &slot.IsRecurring, &slot.RecurringRuleID, &slot.BookedCount,
			&slot.CreatedAt, &slot.UpdatedAt); err != nil {
			return nil, err
		}
		slots = append(slots, slot)
	}

	return slots, nil
}

// DeleteTimeSlot deletes a time slot
func (r *TimeSlotRepository) DeleteTimeSlot(ctx context.Context, id uuid.UUID) error {
	result, err := r.pool.Exec(ctx, `DELETE FROM time_slots WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete time slot: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf(errTimeSlotNotFound)
	}

	return nil
}

// UpdateTimeSlotAvailability updates slot availability
func (r *TimeSlotRepository) UpdateTimeSlotAvailability(ctx context.Context, id uuid.UUID, isAvailable bool) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE time_slots SET is_available = $1, updated_at = $2 WHERE id = $3`,
		isAvailable, time.Now(), id,
	)

	if err != nil {
		return fmt.Errorf("failed to update time slot availability: %w", err)
	}

	return nil
}
