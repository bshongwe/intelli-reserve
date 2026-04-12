package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	pb "github.com/intelli-reserve/backend/gen/go/booking"
	common "github.com/intelli-reserve/backend/gen/go/common"
	"github.com/jackc/pgx/v5"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// BookingServiceServer implements the BookingService gRPC service
type BookingServiceServer struct {
	pb.UnimplementedBookingServiceServer
	db *pgx.Conn
}

// Error message constants
const (
	errBookingIDRequired = "booking_id is required"
	errBookingNotFound   = "booking not found"
)

// NewBookingServiceServer creates a new BookingServiceServer
func NewBookingServiceServer(db *pgx.Conn) *BookingServiceServer {
	return &BookingServiceServer{db: db}
}

// CreateBooking creates a new booking
func (s *BookingServiceServer) CreateBooking(ctx context.Context, req *pb.CreateBookingRequest) (*pb.CreateBookingResponse, error) {
	// Validate required fields
	if req.ServiceId == "" || req.TimeSlotId == "" || req.HostId == "" || req.ClientName == "" || req.ClientEmail == "" {
		return &pb.CreateBookingResponse{
			Success:      false,
			ErrorMessage: "Missing required fields: service_id, time_slot_id, host_id, client_name, client_email",
		}, status.Error(codes.InvalidArgument, "missing required fields")
	}

	bookingID := uuid.New().String()
	now := time.Now().UTC()

	// Insert booking into database
	query := `
		INSERT INTO bookings (id, service_id, time_slot_id, host_id, client_name, client_email, client_phone, number_of_participants, status, notes, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, service_id, time_slot_id, host_id, client_name, client_email, client_phone, number_of_participants, status, notes, created_at, updated_at
	`

	var booking common.Booking
	err := s.db.QueryRow(ctx, query,
		bookingID, req.ServiceId, req.TimeSlotId, req.HostId, req.ClientName,
		req.ClientEmail, req.ClientPhone, req.NumberOfParticipants, "pending", req.Notes, now, now,
	).Scan(
		&booking.Id, &booking.ServiceId, &booking.TimeSlotId, &booking.HostId,
		&booking.ClientName, &booking.ClientEmail, &booking.ClientPhone,
		&booking.NumberOfParticipants, &booking.Status, &booking.Notes,
		&booking.CreatedAt, &booking.UpdatedAt,
	)

	if err != nil {
		log.Printf("Error creating booking: %v", err)
		return &pb.CreateBookingResponse{
			Success:      false,
			ErrorMessage: fmt.Sprintf("Failed to create booking: %v", err),
		}, status.Error(codes.Internal, "failed to create booking")
	}

	log.Printf("✅ Booking created via gRPC: %s", bookingID)

	return &pb.CreateBookingResponse{
		Success: true,
		Booking: &booking,
	}, nil
}

// GetBooking retrieves a booking by ID
func (s *BookingServiceServer) GetBooking(ctx context.Context, req *pb.GetBookingRequest) (*pb.GetBookingResponse, error) {
	if req.BookingId == "" {
		return &pb.GetBookingResponse{
			Success:      false,
			ErrorMessage: errBookingIDRequired,
		}, status.Error(codes.InvalidArgument, errBookingIDRequired)
	}

	var booking common.Booking
	query := `
		SELECT id, service_id, time_slot_id, host_id, client_name, client_email, client_phone, number_of_participants, status, notes, created_at, updated_at
		FROM bookings
		WHERE id = $1
	`

	err := s.db.QueryRow(ctx, query, req.BookingId).Scan(
		&booking.Id, &booking.ServiceId, &booking.TimeSlotId, &booking.HostId,
		&booking.ClientName, &booking.ClientEmail, &booking.ClientPhone,
		&booking.NumberOfParticipants, &booking.Status, &booking.Notes,
		&booking.CreatedAt, &booking.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return &pb.GetBookingResponse{
			Success:      false,
			ErrorMessage: errBookingNotFound,
		}, status.Error(codes.NotFound, errBookingNotFound)
	}

	if err != nil {
		log.Printf("Error retrieving booking: %v", err)
		return &pb.GetBookingResponse{
			Success:      false,
			ErrorMessage: fmt.Sprintf("Failed to retrieve booking: %v", err),
		}, status.Error(codes.Internal, "failed to retrieve booking")
	}

	return &pb.GetBookingResponse{
		Success: true,
		Booking: &booking,
	}, nil
}

// GetHostBookings retrieves bookings by host ID
func (s *BookingServiceServer) GetHostBookings(ctx context.Context, req *pb.GetHostBookingsRequest) (*pb.GetHostBookingsResponse, error) {
	if req.HostId == "" {
		return &pb.GetHostBookingsResponse{
			Success:      false,
			ErrorMessage: "host_id is required",
		}, status.Error(codes.InvalidArgument, "host_id is required")
	}

	limit := int32(50)
	if req.Limit > 0 && req.Limit < 1000 {
		limit = req.Limit
	}
	offset := req.Offset
	if offset < 0 {
		offset = 0
	}

	var query string
	var rows pgx.Rows
	var err error

	if req.StatusFilter != "" {
		query = `
			SELECT id, service_id, time_slot_id, host_id, client_name, client_email, client_phone, number_of_participants, status, notes, created_at, updated_at
			FROM bookings
			WHERE host_id = $1 AND status = $2
			ORDER BY created_at DESC
			LIMIT $3 OFFSET $4
		`
		rows, err = s.db.Query(ctx, query, req.HostId, req.StatusFilter, limit, offset)
	} else {
		query = `
			SELECT id, service_id, time_slot_id, host_id, client_name, client_email, client_phone, number_of_participants, status, notes, created_at, updated_at
			FROM bookings
			WHERE host_id = $1
			ORDER BY created_at DESC
			LIMIT $2 OFFSET $3
		`
		rows, err = s.db.Query(ctx, query, req.HostId, limit, offset)
	}

	if err != nil {
		log.Printf("Error querying bookings: %v", err)
		return &pb.GetHostBookingsResponse{
			Success:      false,
			ErrorMessage: fmt.Sprintf("Failed to retrieve bookings: %v", err),
		}, status.Error(codes.Internal, "failed to retrieve bookings")
	}
	defer rows.Close()

	var bookings []*common.Booking
	for rows.Next() {
		var booking common.Booking
		err := rows.Scan(
			&booking.Id, &booking.ServiceId, &booking.TimeSlotId, &booking.HostId,
			&booking.ClientName, &booking.ClientEmail, &booking.ClientPhone,
			&booking.NumberOfParticipants, &booking.Status, &booking.Notes,
			&booking.CreatedAt, &booking.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning booking: %v", err)
			continue
		}
		bookings = append(bookings, &booking)
	}

	// Get total count
	var totalCount int32
	countQuery := "SELECT COUNT(*) FROM bookings WHERE host_id = $1"
	if req.StatusFilter != "" {
		countQuery += " AND status = $2"
		s.db.QueryRow(ctx, countQuery, req.HostId, req.StatusFilter).Scan(&totalCount)
	} else {
		s.db.QueryRow(ctx, countQuery, req.HostId).Scan(&totalCount)
	}

	return &pb.GetHostBookingsResponse{
		Success:    true,
		Bookings:   bookings,
		TotalCount: totalCount,
	}, nil
}

// GetClientBookings retrieves bookings by client email
func (s *BookingServiceServer) GetClientBookings(ctx context.Context, req *pb.GetClientBookingsRequest) (*pb.GetClientBookingsResponse, error) {
	if req.ClientEmail == "" {
		return &pb.GetClientBookingsResponse{
			Success:      false,
			ErrorMessage: "client_email is required",
		}, status.Error(codes.InvalidArgument, "client_email is required")
	}

	limit := int32(50)
	if req.Limit > 0 && req.Limit < 1000 {
		limit = req.Limit
	}
	offset := req.Offset
	if offset < 0 {
		offset = 0
	}

	var query string
	var rows pgx.Rows
	var err error

	if req.StatusFilter != "" {
		query = `
			SELECT id, service_id, time_slot_id, host_id, client_name, client_email, client_phone, number_of_participants, status, notes, created_at, updated_at
			FROM bookings
			WHERE client_email = $1 AND status = $2
			ORDER BY created_at DESC
			LIMIT $3 OFFSET $4
		`
		rows, err = s.db.Query(ctx, query, req.ClientEmail, req.StatusFilter, limit, offset)
	} else {
		query = `
			SELECT id, service_id, time_slot_id, host_id, client_name, client_email, client_phone, number_of_participants, status, notes, created_at, updated_at
			FROM bookings
			WHERE client_email = $1
			ORDER BY created_at DESC
			LIMIT $2 OFFSET $3
		`
		rows, err = s.db.Query(ctx, query, req.ClientEmail, limit, offset)
	}

	if err != nil {
		log.Printf("Error querying bookings: %v", err)
		return &pb.GetClientBookingsResponse{
			Success:      false,
			ErrorMessage: fmt.Sprintf("Failed to retrieve bookings: %v", err),
		}, status.Error(codes.Internal, "failed to retrieve bookings")
	}
	defer rows.Close()

	var bookings []*common.Booking
	for rows.Next() {
		var booking common.Booking
		err := rows.Scan(
			&booking.Id, &booking.ServiceId, &booking.TimeSlotId, &booking.HostId,
			&booking.ClientName, &booking.ClientEmail, &booking.ClientPhone,
			&booking.NumberOfParticipants, &booking.Status, &booking.Notes,
			&booking.CreatedAt, &booking.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning booking: %v", err)
			continue
		}
		bookings = append(bookings, &booking)
	}

	// Get total count
	var totalCount int32
	countQuery := "SELECT COUNT(*) FROM bookings WHERE client_email = $1"
	if req.StatusFilter != "" {
		countQuery += " AND status = $2"
		s.db.QueryRow(ctx, countQuery, req.ClientEmail, req.StatusFilter).Scan(&totalCount)
	} else {
		s.db.QueryRow(ctx, countQuery, req.ClientEmail).Scan(&totalCount)
	}

	return &pb.GetClientBookingsResponse{
		Success:    true,
		Bookings:   bookings,
		TotalCount: totalCount,
	}, nil
}

// UpdateBookingStatus updates the status of a booking
func (s *BookingServiceServer) UpdateBookingStatus(ctx context.Context, req *pb.UpdateBookingStatusRequest) (*pb.UpdateBookingStatusResponse, error) {
	if req.BookingId == "" || req.NewStatus == "" {
		return &pb.UpdateBookingStatusResponse{
			Success:      false,
			ErrorMessage: "booking_id and new_status are required",
		}, status.Error(codes.InvalidArgument, "booking_id and new_status are required")
	}

	// Validate status
	validStatuses := map[string]bool{"pending": true, "confirmed": true, "cancelled": true, "completed": true}
	if !validStatuses[req.NewStatus] {
		return &pb.UpdateBookingStatusResponse{
			Success:      false,
			ErrorMessage: "invalid status. Must be: pending, confirmed, cancelled, or completed",
		}, status.Error(codes.InvalidArgument, "invalid status")
	}

	now := time.Now().UTC()
	query := `
		UPDATE bookings 
		SET status = $1, updated_at = $2
		WHERE id = $3
		RETURNING id, service_id, time_slot_id, host_id, client_name, client_email, client_phone, number_of_participants, status, notes, created_at, updated_at
	`

	var booking common.Booking
	err := s.db.QueryRow(ctx, query, req.NewStatus, now, req.BookingId).Scan(
		&booking.Id, &booking.ServiceId, &booking.TimeSlotId, &booking.HostId,
		&booking.ClientName, &booking.ClientEmail, &booking.ClientPhone,
		&booking.NumberOfParticipants, &booking.Status, &booking.Notes,
		&booking.CreatedAt, &booking.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return &pb.UpdateBookingStatusResponse{
			Success:      false,
			ErrorMessage: errBookingNotFound,
		}, status.Error(codes.NotFound, errBookingNotFound)
	}

	if err != nil {
		log.Printf("Error updating booking status: %v", err)
		return &pb.UpdateBookingStatusResponse{
			Success:      false,
			ErrorMessage: fmt.Sprintf("Failed to update booking: %v", err),
		}, status.Error(codes.Internal, "failed to update booking")
	}

	log.Printf("✅ Booking status updated via gRPC: %s -> %s", req.BookingId, req.NewStatus)

	return &pb.UpdateBookingStatusResponse{
		Success: true,
		Booking: &booking,
	}, nil
}

// CancelBooking cancels a booking
func (s *BookingServiceServer) CancelBooking(ctx context.Context, req *pb.CancelBookingRequest) (*pb.CancelBookingResponse, error) {
	if req.BookingId == "" {
		return &pb.CancelBookingResponse{
			Success:      false,
			ErrorMessage: errBookingIDRequired,
		}, status.Error(codes.InvalidArgument, errBookingIDRequired)
	}

	now := time.Now().UTC()
	notes := fmt.Sprintf("Cancelled. Reason: %s", req.Reason)

	query := `
		UPDATE bookings 
		SET status = 'cancelled', notes = $1, updated_at = $2
		WHERE id = $3
		RETURNING id, service_id, time_slot_id, host_id, client_name, client_email, client_phone, number_of_participants, status, notes, created_at, updated_at
	`

	var booking common.Booking
	err := s.db.QueryRow(ctx, query, notes, now, req.BookingId).Scan(
		&booking.Id, &booking.ServiceId, &booking.TimeSlotId, &booking.HostId,
		&booking.ClientName, &booking.ClientEmail, &booking.ClientPhone,
		&booking.NumberOfParticipants, &booking.Status, &booking.Notes,
		&booking.CreatedAt, &booking.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return &pb.CancelBookingResponse{
			Success:      false,
			ErrorMessage: errBookingNotFound,
		}, status.Error(codes.NotFound, errBookingNotFound)
	}

	if err != nil {
		log.Printf("Error cancelling booking: %v", err)
		return &pb.CancelBookingResponse{
			Success:      false,
			ErrorMessage: fmt.Sprintf("Failed to cancel booking: %v", err),
		}, status.Error(codes.Internal, "failed to cancel booking")
	}

	log.Printf("✅ Booking cancelled via gRPC: %s", req.BookingId)

	return &pb.CancelBookingResponse{
		Success: true,
		Booking: &booking,
	}, nil
}

// DeleteBooking deletes a booking
func (s *BookingServiceServer) DeleteBooking(ctx context.Context, req *pb.DeleteBookingRequest) (*pb.DeleteBookingResponse, error) {
	if req.BookingId == "" {
		return &pb.DeleteBookingResponse{
			Success:      false,
			ErrorMessage: errBookingIDRequired,
		}, status.Error(codes.InvalidArgument, errBookingIDRequired)
	}

	query := "DELETE FROM bookings WHERE id = $1"
	result, err := s.db.Exec(ctx, query, req.BookingId)

	if err != nil {
		log.Printf("Error deleting booking: %v", err)
		return &pb.DeleteBookingResponse{
			Success:      false,
			ErrorMessage: fmt.Sprintf("Failed to delete booking: %v", err),
		}, status.Error(codes.Internal, "failed to delete booking")
	}

	if result.RowsAffected() == 0 {
		return &pb.DeleteBookingResponse{
			Success:      false,
			ErrorMessage: errBookingNotFound,
		}, status.Error(codes.NotFound, errBookingNotFound)
	}

	log.Printf("✅ Booking deleted via gRPC: %s", req.BookingId)

	return &pb.DeleteBookingResponse{
		Success: true,
	}, nil
}
