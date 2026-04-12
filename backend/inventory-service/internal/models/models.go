package models

import (
	"time"

	"github.com/google/uuid"
)

// Service represents a service offered by a host
type Service struct {
	ID              uuid.UUID `db:"id"`
	HostID          uuid.UUID `db:"host_id"`
	Name            string    `db:"name"`
	Description     string    `db:"description"`
	Category        string    `db:"category"`
	DurationMinutes int       `db:"duration_minutes"`
	BasePrice       int       `db:"base_price"` // in cents
	MaxParticipants int       `db:"max_participants"`
	IsActive        bool      `db:"is_active"`
	CreatedAt       time.Time `db:"created_at"`
	UpdatedAt       time.Time `db:"updated_at"`
}

// TimeSlot represents an individual time slot for a service
type TimeSlot struct {
	ID              uuid.UUID  `db:"id"`
	ServiceID       uuid.UUID  `db:"service_id"`
	SlotDate        time.Time  `db:"slot_date"`
	StartTime       string     `db:"start_time"` // HH:MM format
	EndTime         string     `db:"end_time"`   // HH:MM format
	IsAvailable     bool       `db:"is_available"`
	IsRecurring     bool       `db:"is_recurring"`
	RecurringRuleID *uuid.UUID `db:"recurring_rule_id"`
	BookedCount     int        `db:"booked_participants"`
	CreatedAt       time.Time  `db:"created_at"`
	UpdatedAt       time.Time  `db:"updated_at"`
}

// RecurringSlotRule represents a rule for generating recurring slots
type RecurringSlotRule struct {
	ID          uuid.UUID `db:"id"`
	ServiceID   uuid.UUID `db:"service_id"`
	StartTime   string    `db:"start_time"`   // HH:MM format
	EndTime     string    `db:"end_time"`     // HH:MM format
	DaysOfWeek  []int     `db:"days_of_week"` // 0-6, 0=Sunday
	StartDate   time.Time `db:"start_date"`
	EndDate     *time.Time `db:"end_date"`
	IsActive    bool      `db:"is_active"`
	CreatedAt   time.Time `db:"created_at"`
	UpdatedAt   time.Time `db:"updated_at"`
}

// AvailabilityBlock represents a blocked time period
type AvailabilityBlock struct {
	ID         uuid.UUID `db:"id"`
	HostID     uuid.UUID `db:"host_id"`
	BlockStart time.Time `db:"block_start"`
	BlockEnd   time.Time `db:"block_end"`
	Reason     *string   `db:"reason"`
	CreatedAt  time.Time `db:"created_at"`
	UpdatedAt  time.Time `db:"updated_at"`
}

// Booking represents a service booking
type Booking struct {
	ID                  uuid.UUID `db:"id"`
	CustomerID          uuid.UUID `db:"customer_id"`
	TimeSlotID          uuid.UUID `db:"time_slot_id"`
	ServiceID           uuid.UUID `db:"service_id"`
	HostID              uuid.UUID `db:"host_id"`
	NumberOfParticipants int      `db:"number_of_participants"`
	Status              string    `db:"status"` // pending, confirmed, cancelled, completed, no_show
	TotalPrice          int       `db:"total_price"` // in cents
	CreatedAt           time.Time `db:"created_at"`
	UpdatedAt           time.Time `db:"updated_at"`
}

// Category types
const (
	CategoryPhotography = "Photography"
	CategoryConsulting  = "Consulting"
	CategoryWorkshop    = "Workshop"
	CategoryCoaching    = "Coaching"
	CategoryOther       = "Other"
)

// Booking status types
const (
	BookingStatusPending   = "pending"
	BookingStatusConfirmed = "confirmed"
	BookingStatusCancelled = "cancelled"
	BookingStatusCompleted = "completed"
	BookingStatusNoShow    = "no_show"
)
