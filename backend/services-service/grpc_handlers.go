package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	pb "github.com/intelli-reserve/backend/gen/go/services"
	common "github.com/intelli-reserve/backend/gen/go/common"
	"github.com/jackc/pgx/v5"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type ServicesManagementServer struct {
	pb.UnimplementedServicesManagementServer
	db *pgx.Conn
}

func NewServicesManagementServer(db *pgx.Conn) *ServicesManagementServer {
	return &ServicesManagementServer{db: db}
}

// ─── Helpers ────────────────────────────────────────────────────────────────

func formatTS(t time.Time) string { return t.Format(time.RFC3339) }

func scanService(row pgx.Row) (*common.Service, error) {
	var s common.Service
	var createdAt, updatedAt time.Time
	err := row.Scan(
		&s.Id, &s.HostId, &s.Name, &s.Description, &s.Category,
		&s.DurationMinutes, &s.BasePrice, &s.MaxParticipants, &s.IsActive,
		&createdAt, &updatedAt,
	)
	if err != nil {
		return nil, err
	}
	s.CreatedAt = formatTS(createdAt)
	s.UpdatedAt = formatTS(updatedAt)
	return &s, nil
}

func scanTimeSlot(row pgx.Row) (*common.TimeSlot, error) {
	var ts common.TimeSlot
	var createdAt, updatedAt time.Time
	var slotDate time.Time
	var startTime, endTime string
	err := row.Scan(
		&ts.Id, &ts.ServiceId, &slotDate, &startTime, &endTime,
		&ts.IsAvailable, &createdAt, &updatedAt,
	)
	if err != nil {
		return nil, err
	}
	ts.Date = slotDate.Format("2006-01-02")
	ts.StartTime = startTime
	ts.EndTime = endTime
	ts.CreatedAt = formatTS(createdAt)
	ts.UpdatedAt = formatTS(updatedAt)
	return &ts, nil
}

// ─── Service RPCs ────────────────────────────────────────────────────────────

func (s *ServicesManagementServer) CreateService(ctx context.Context, req *pb.CreateServiceRequest) (*pb.CreateServiceResponse, error) {
	if req.HostId == "" || req.Name == "" {
		return &pb.CreateServiceResponse{Success: false, ErrorMessage: "host_id and name are required"},
			status.Error(codes.InvalidArgument, "host_id and name are required")
	}

	id := uuid.New().String()
	now := time.Now().UTC()

	svc, err := scanService(s.db.QueryRow(ctx,
		`INSERT INTO services (id, host_id, name, description, category, duration_minutes, base_price, max_participants, is_active, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		 RETURNING id, host_id, name, description, category, duration_minutes, base_price, max_participants, is_active, created_at, updated_at`,
		id, req.HostId, req.Name, req.Description, req.Category,
		req.DurationMinutes, req.BasePrice, req.MaxParticipants, req.IsActive, now, now,
	))
	if err != nil {
		log.Printf("Error creating service: %v", err)
		return &pb.CreateServiceResponse{Success: false, ErrorMessage: fmt.Sprintf("failed to create service: %v", err)},
			status.Error(codes.Internal, "failed to create service")
	}

	log.Printf("✅ Service created: %s", id)
	return &pb.CreateServiceResponse{Success: true, Service: svc}, nil
}

func (s *ServicesManagementServer) GetService(ctx context.Context, req *pb.GetServiceRequest) (*pb.GetServiceResponse, error) {
	if req.ServiceId == "" {
		return &pb.GetServiceResponse{Success: false, ErrorMessage: "service_id is required"},
			status.Error(codes.InvalidArgument, "service_id is required")
	}

	svc, err := scanService(s.db.QueryRow(ctx,
		`SELECT id, host_id, name, description, category, duration_minutes, base_price, max_participants, is_active, created_at, updated_at
		 FROM services WHERE id = $1`,
		req.ServiceId,
	))
	if err == pgx.ErrNoRows {
		return &pb.GetServiceResponse{Success: false, ErrorMessage: "service not found"},
			status.Error(codes.NotFound, "service not found")
	}
	if err != nil {
		log.Printf("Error fetching service: %v", err)
		return &pb.GetServiceResponse{Success: false, ErrorMessage: fmt.Sprintf("failed to fetch service: %v", err)},
			status.Error(codes.Internal, "failed to fetch service")
	}

	return &pb.GetServiceResponse{Success: true, Service: svc}, nil
}

func (s *ServicesManagementServer) GetHostServices(ctx context.Context, req *pb.GetHostServicesRequest) (*pb.GetHostServicesResponse, error) {
	if req.HostId == "" {
		return &pb.GetHostServicesResponse{Success: false, ErrorMessage: "host_id is required"},
			status.Error(codes.InvalidArgument, "host_id is required")
	}

	limit := req.Limit
	if limit <= 0 || limit > 1000 {
		limit = 50
	}
	offset := req.Offset
	if offset < 0 {
		offset = 0
	}

	var query string
	var args []any
	if req.OnlyActive {
		query = `SELECT id, host_id, name, description, category, duration_minutes, base_price, max_participants, is_active, created_at, updated_at
		         FROM services WHERE host_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT $2 OFFSET $3`
		args = []any{req.HostId, limit, offset}
	} else {
		query = `SELECT id, host_id, name, description, category, duration_minutes, base_price, max_participants, is_active, created_at, updated_at
		         FROM services WHERE host_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`
		args = []any{req.HostId, limit, offset}
	}

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		log.Printf("Error fetching host services: %v", err)
		return &pb.GetHostServicesResponse{Success: false, ErrorMessage: fmt.Sprintf("failed to fetch services: %v", err)},
			status.Error(codes.Internal, "failed to fetch services")
	}
	defer rows.Close()

	var services []*common.Service
	for rows.Next() {
		var svc common.Service
		var createdAt, updatedAt time.Time
		if err := rows.Scan(
			&svc.Id, &svc.HostId, &svc.Name, &svc.Description, &svc.Category,
			&svc.DurationMinutes, &svc.BasePrice, &svc.MaxParticipants, &svc.IsActive,
			&createdAt, &updatedAt,
		); err != nil {
			log.Printf("Error scanning service: %v", err)
			continue
		}
		svc.CreatedAt = formatTS(createdAt)
		svc.UpdatedAt = formatTS(updatedAt)
		services = append(services, &svc)
	}

	var totalCount int32
	countQuery := "SELECT COUNT(*) FROM services WHERE host_id = $1"
	if req.OnlyActive {
		countQuery += " AND is_active = true"
	}
	s.db.QueryRow(ctx, countQuery, req.HostId).Scan(&totalCount)

	return &pb.GetHostServicesResponse{Success: true, Services: services, TotalCount: totalCount}, nil
}

func (s *ServicesManagementServer) GetBrowseableServices(ctx context.Context, req *pb.GetBrowseableServicesRequest) (*pb.GetBrowseableServicesResponse, error) {
	limit := req.Limit
	if limit <= 0 || limit > 1000 {
		limit = 50
	}
	offset := req.Offset
	if offset < 0 {
		offset = 0
	}

	query := `SELECT id, host_id, name, description, category, duration_minutes, base_price, max_participants, is_active, created_at, updated_at
	          FROM services WHERE is_active = true ORDER BY created_at DESC LIMIT $1 OFFSET $2`

	rows, err := s.db.Query(ctx, query, limit, offset)
	if err != nil {
		log.Printf("Error fetching browseable services: %v", err)
		return &pb.GetBrowseableServicesResponse{Success: false, ErrorMessage: fmt.Sprintf("failed to fetch services: %v", err)},
			status.Error(codes.Internal, "failed to fetch services")
	}
	defer rows.Close()

	var services []*common.Service
	for rows.Next() {
		var svc common.Service
		var createdAt, updatedAt time.Time
		if err := rows.Scan(
			&svc.Id, &svc.HostId, &svc.Name, &svc.Description, &svc.Category,
			&svc.DurationMinutes, &svc.BasePrice, &svc.MaxParticipants, &svc.IsActive,
			&createdAt, &updatedAt,
		); err != nil {
			log.Printf("Error scanning service: %v", err)
			continue
		}
		svc.CreatedAt = formatTS(createdAt)
		svc.UpdatedAt = formatTS(updatedAt)
		services = append(services, &svc)
	}

	var totalCount int32
	s.db.QueryRow(ctx, "SELECT COUNT(*) FROM services WHERE is_active = true").Scan(&totalCount)

	return &pb.GetBrowseableServicesResponse{Success: true, Services: services, TotalCount: totalCount}, nil
}

func (s *ServicesManagementServer) UpdateService(ctx context.Context, req *pb.UpdateServiceRequest) (*pb.UpdateServiceResponse, error) {
	if req.ServiceId == "" {
		return &pb.UpdateServiceResponse{Success: false, ErrorMessage: "service_id is required"},
			status.Error(codes.InvalidArgument, "service_id is required")
	}

	now := time.Now().UTC()
	setClauses := []string{"updated_at = $1"}
	args := []any{now}
	p := 2

	if req.Name != nil        { setClauses = append(setClauses, fmt.Sprintf("name = $%d", p));             args = append(args, req.GetName());            p++ }
	if req.Description != nil { setClauses = append(setClauses, fmt.Sprintf("description = $%d", p));      args = append(args, req.GetDescription());      p++ }
	if req.Category != nil    { setClauses = append(setClauses, fmt.Sprintf("category = $%d", p));         args = append(args, req.GetCategory());         p++ }
	if req.DurationMinutes != nil { setClauses = append(setClauses, fmt.Sprintf("duration_minutes = $%d", p)); args = append(args, req.GetDurationMinutes()); p++ }
	if req.BasePrice != nil   { setClauses = append(setClauses, fmt.Sprintf("base_price = $%d", p));       args = append(args, req.GetBasePrice());        p++ }
	if req.MaxParticipants != nil { setClauses = append(setClauses, fmt.Sprintf("max_participants = $%d", p)); args = append(args, req.GetMaxParticipants()); p++ }
	if req.IsActive != nil    { setClauses = append(setClauses, fmt.Sprintf("is_active = $%d", p));        args = append(args, req.GetIsActive());         p++ }

	args = append(args, req.ServiceId)
	query := fmt.Sprintf(
		`UPDATE services SET %s WHERE id = $%d
		 RETURNING id, host_id, name, description, category, duration_minutes, base_price, max_participants, is_active, created_at, updated_at`,
		joinClauses(setClauses), p,
	)

	svc, err := scanService(s.db.QueryRow(ctx, query, args...))
	if err == pgx.ErrNoRows {
		return &pb.UpdateServiceResponse{Success: false, ErrorMessage: "service not found"},
			status.Error(codes.NotFound, "service not found")
	}
	if err != nil {
		log.Printf("Error updating service: %v", err)
		return &pb.UpdateServiceResponse{Success: false, ErrorMessage: fmt.Sprintf("failed to update service: %v", err)},
			status.Error(codes.Internal, "failed to update service")
	}

	log.Printf("✅ Service updated: %s", req.ServiceId)
	return &pb.UpdateServiceResponse{Success: true, Service: svc}, nil
}

func (s *ServicesManagementServer) DeleteService(ctx context.Context, req *pb.DeleteServiceRequest) (*pb.DeleteServiceResponse, error) {
	if req.ServiceId == "" {
		return &pb.DeleteServiceResponse{Success: false, ErrorMessage: "service_id is required"},
			status.Error(codes.InvalidArgument, "service_id is required")
	}

	result, err := s.db.Exec(ctx, `DELETE FROM services WHERE id = $1`, req.ServiceId)
	if err != nil {
		log.Printf("Error deleting service: %v", err)
		return &pb.DeleteServiceResponse{Success: false, ErrorMessage: fmt.Sprintf("failed to delete service: %v", err)},
			status.Error(codes.Internal, "failed to delete service")
	}
	if result.RowsAffected() == 0 {
		return &pb.DeleteServiceResponse{Success: false, ErrorMessage: "service not found"},
			status.Error(codes.NotFound, "service not found")
	}

	log.Printf("✅ Service deleted: %s", req.ServiceId)
	return &pb.DeleteServiceResponse{Success: true}, nil
}

// ─── Time Slot RPCs ──────────────────────────────────────────────────────────

func (s *ServicesManagementServer) CreateTimeSlot(ctx context.Context, req *pb.CreateTimeSlotRequest) (*pb.CreateTimeSlotResponse, error) {
	if req.ServiceId == "" || req.Date == "" || req.StartTime == "" || req.EndTime == "" {
		return &pb.CreateTimeSlotResponse{Success: false, ErrorMessage: "service_id, date, start_time, end_time are required"},
			status.Error(codes.InvalidArgument, "missing required fields")
	}

	id := uuid.New().String()
	now := time.Now().UTC()

	ts, err := scanTimeSlot(s.db.QueryRow(ctx,
		`INSERT INTO time_slots (id, service_id, slot_date, start_time, end_time, is_available, created_at, updated_at)
		 VALUES ($1, $2, $3::date, $4::time, $5::time, $6, $7, $8)
		 RETURNING id, service_id, slot_date, start_time, end_time, is_available, created_at, updated_at`,
		id, req.ServiceId, req.Date, req.StartTime, req.EndTime, req.IsAvailable, now, now,
	))
	if err != nil {
		log.Printf("Error creating time slot: %v", err)
		return &pb.CreateTimeSlotResponse{Success: false, ErrorMessage: fmt.Sprintf("failed to create time slot: %v", err)},
			status.Error(codes.Internal, "failed to create time slot")
	}

	log.Printf("✅ Time slot created: %s", id)
	return &pb.CreateTimeSlotResponse{Success: true, TimeSlot: ts}, nil
}

func (s *ServicesManagementServer) GetTimeSlot(ctx context.Context, req *pb.GetTimeSlotRequest) (*pb.GetTimeSlotResponse, error) {
	if req.TimeSlotId == "" {
		return &pb.GetTimeSlotResponse{Success: false, ErrorMessage: "time_slot_id is required"},
			status.Error(codes.InvalidArgument, "time_slot_id is required")
	}

	ts, err := scanTimeSlot(s.db.QueryRow(ctx,
		`SELECT id, service_id, slot_date, start_time, end_time, is_available, created_at, updated_at
		 FROM time_slots WHERE id = $1`,
		req.TimeSlotId,
	))
	if err == pgx.ErrNoRows {
		return &pb.GetTimeSlotResponse{Success: false, ErrorMessage: "time slot not found"},
			status.Error(codes.NotFound, "time slot not found")
	}
	if err != nil {
		log.Printf("Error fetching time slot: %v", err)
		return &pb.GetTimeSlotResponse{Success: false, ErrorMessage: fmt.Sprintf("failed to fetch time slot: %v", err)},
			status.Error(codes.Internal, "failed to fetch time slot")
	}

	return &pb.GetTimeSlotResponse{Success: true, TimeSlot: ts}, nil
}

func (s *ServicesManagementServer) GetAvailableTimeSlots(ctx context.Context, req *pb.GetAvailableTimeSlotsRequest) (*pb.GetAvailableTimeSlotsResponse, error) {
	if req.ServiceId == "" {
		return &pb.GetAvailableTimeSlotsResponse{Success: false, ErrorMessage: "service_id is required"},
			status.Error(codes.InvalidArgument, "service_id is required")
	}

	query := `SELECT id, service_id, slot_date, start_time, end_time, is_available, created_at, updated_at
	          FROM time_slots
	          WHERE service_id = $1 AND is_available = true`
	args := []any{req.ServiceId}

	if req.DateFrom != "" && req.DateTo != "" {
		query += " AND slot_date BETWEEN $2::date AND $3::date"
		args = append(args, req.DateFrom, req.DateTo)
	}
	query += " ORDER BY slot_date ASC, start_time ASC"

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		log.Printf("Error fetching time slots: %v", err)
		return &pb.GetAvailableTimeSlotsResponse{Success: false, ErrorMessage: fmt.Sprintf("failed to fetch time slots: %v", err)},
			status.Error(codes.Internal, "failed to fetch time slots")
	}
	defer rows.Close()

	var slots []*common.TimeSlot
	for rows.Next() {
		var ts common.TimeSlot
		var createdAt, updatedAt, slotDate time.Time
		var startTime, endTime string
		if err := rows.Scan(&ts.Id, &ts.ServiceId, &slotDate, &startTime, &endTime, &ts.IsAvailable, &createdAt, &updatedAt); err != nil {
			log.Printf("Error scanning time slot: %v", err)
			continue
		}
		ts.Date = slotDate.Format("2006-01-02")
		ts.StartTime = startTime
		ts.EndTime = endTime
		ts.CreatedAt = formatTS(createdAt)
		ts.UpdatedAt = formatTS(updatedAt)
		slots = append(slots, &ts)
	}

	return &pb.GetAvailableTimeSlotsResponse{Success: true, TimeSlots: slots}, nil
}

func (s *ServicesManagementServer) UpdateTimeSlotAvailability(ctx context.Context, req *pb.UpdateTimeSlotAvailabilityRequest) (*pb.UpdateTimeSlotAvailabilityResponse, error) {
	if req.TimeSlotId == "" {
		return &pb.UpdateTimeSlotAvailabilityResponse{Success: false, ErrorMessage: "time_slot_id is required"},
			status.Error(codes.InvalidArgument, "time_slot_id is required")
	}

	now := time.Now().UTC()
	ts, err := scanTimeSlot(s.db.QueryRow(ctx,
		`UPDATE time_slots SET is_available = $1, updated_at = $2 WHERE id = $3
		 RETURNING id, service_id, slot_date, start_time, end_time, is_available, created_at, updated_at`,
		req.IsAvailable, now, req.TimeSlotId,
	))
	if err == pgx.ErrNoRows {
		return &pb.UpdateTimeSlotAvailabilityResponse{Success: false, ErrorMessage: "time slot not found"},
			status.Error(codes.NotFound, "time slot not found")
	}
	if err != nil {
		log.Printf("Error updating time slot availability: %v", err)
		return &pb.UpdateTimeSlotAvailabilityResponse{Success: false, ErrorMessage: fmt.Sprintf("failed to update time slot: %v", err)},
			status.Error(codes.Internal, "failed to update time slot")
	}

	log.Printf("✅ Time slot availability updated: %s -> %v", req.TimeSlotId, req.IsAvailable)
	return &pb.UpdateTimeSlotAvailabilityResponse{Success: true, TimeSlot: ts}, nil
}

func (s *ServicesManagementServer) DeleteTimeSlot(ctx context.Context, req *pb.DeleteTimeSlotRequest) (*pb.DeleteTimeSlotResponse, error) {
	if req.TimeSlotId == "" {
		return &pb.DeleteTimeSlotResponse{Success: false, ErrorMessage: "time_slot_id is required"},
			status.Error(codes.InvalidArgument, "time_slot_id is required")
	}

	result, err := s.db.Exec(ctx, `DELETE FROM time_slots WHERE id = $1`, req.TimeSlotId)
	if err != nil {
		log.Printf("Error deleting time slot: %v", err)
		return &pb.DeleteTimeSlotResponse{Success: false, ErrorMessage: fmt.Sprintf("failed to delete time slot: %v", err)},
			status.Error(codes.Internal, "failed to delete time slot")
	}
	if result.RowsAffected() == 0 {
		return &pb.DeleteTimeSlotResponse{Success: false, ErrorMessage: "time slot not found"},
			status.Error(codes.NotFound, "time slot not found")
	}

	log.Printf("✅ Time slot deleted: %s", req.TimeSlotId)
	return &pb.DeleteTimeSlotResponse{Success: true}, nil
}

// joinClauses joins SET clauses with commas
func joinClauses(clauses []string) string {
	result := ""
	for i, c := range clauses {
		if i > 0 {
			result += ", "
		}
		result += c
	}
	return result
}
