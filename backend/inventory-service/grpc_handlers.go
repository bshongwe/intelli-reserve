package main

import (
	"context"
	"log"
	"time"

	pb "github.com/intelli-reserve/backend/gen/go/inventory"
	"github.com/jackc/pgx/v5"
	"github.com/google/uuid"
)

type InventoryServiceServer struct {
	db *pgx.Conn
	pb.UnimplementedInventoryServiceServer
}

func NewInventoryServiceServer(db *pgx.Conn) *InventoryServiceServer {
	return &InventoryServiceServer{db: db}
}

func (s *InventoryServiceServer) CreateTimeSlot(ctx context.Context, req *pb.CreateTimeSlotRequest) (*pb.CreateTimeSlotResponse, error) {
	id := uuid.New().String()
	now := time.Now().Format(time.RFC3339)

	query := `
		INSERT INTO time_slots (id, service_id, slot_date, start_time, end_time, capacity, is_available, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`

	_, err := s.db.Exec(ctx, query, id, req.ServiceId, req.Date, req.StartTime, req.EndTime, req.Capacity, req.IsAvailable, now, now)
	if err != nil {
		return &pb.CreateTimeSlotResponse{Success: false, ErrorMessage: err.Error()}, nil
	}

	return &pb.CreateTimeSlotResponse{
		Success: true,
		TimeSlot: &pb.TimeSlotDetail{
			Id:             id,
			ServiceId:      req.ServiceId,
			Date:           req.Date,
			StartTime:      req.StartTime,
			EndTime:        req.EndTime,
			Capacity:       req.Capacity,
			BookedCount:    0,
			AvailableSpots: req.Capacity,
			IsAvailable:    req.IsAvailable,
			Status:         "open",
			CreatedAt:      now,
			UpdatedAt:      now,
		},
	}, nil
}

func (s *InventoryServiceServer) GetTimeSlots(ctx context.Context, req *pb.GetTimeSlotsRequest) (*pb.GetTimeSlotsResponse, error) {
	query := `
		SELECT 
			ts.id, ts.service_id, ts.slot_date, ts.start_time, ts.end_time,
			ts.capacity, COALESCE(COUNT(DISTINCT b.id), 0) as booked_count, ts.is_available, ts.created_at, ts.updated_at
		FROM time_slots ts
		LEFT JOIN bookings b ON ts.id = b.time_slot_id AND b.status IN ('pending', 'confirmed')
		WHERE ts.service_id = $1 AND ts.slot_date = $2
		GROUP BY ts.id
		ORDER BY ts.start_time ASC
	`

	rows, err := s.db.Query(ctx, query, req.ServiceId, req.Date)
	if err != nil {
		return &pb.GetTimeSlotsResponse{Success: false, ErrorMessage: err.Error()}, nil
	}
	defer rows.Close()

	var slots []*pb.TimeSlotDetail
	for rows.Next() {
		var id, serviceId, date, startTime, endTime, createdAt, updatedAt string
		var capacity, bookedCount int32
		var isAvailable bool

		if err := rows.Scan(&id, &serviceId, &date, &startTime, &endTime, &capacity, &bookedCount, &isAvailable, &createdAt, &updatedAt); err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}

		availableSpots := capacity - bookedCount
		status := "open"
		if bookedCount >= capacity {
			status = "full"
		} else if !isAvailable {
			status = "blocked"
		}

		slots = append(slots, &pb.TimeSlotDetail{
			Id:             id,
			ServiceId:      serviceId,
			Date:           date,
			StartTime:      startTime,
			EndTime:        endTime,
			Capacity:       capacity,
			BookedCount:    bookedCount,
			AvailableSpots: availableSpots,
			IsAvailable:    isAvailable,
			Status:         status,
			CreatedAt:      createdAt,
			UpdatedAt:      updatedAt,
		})
	}

	return &pb.GetTimeSlotsResponse{
		Success: true,
		Slots:   slots,
	}, nil
}

func (s *InventoryServiceServer) UpdateOccupancy(ctx context.Context, req *pb.UpdateOccupancyRequest) (*pb.UpdateOccupancyResponse, error) {
	now := time.Now().Format(time.RFC3339)
	query := `
		SELECT ts.capacity FROM time_slots ts WHERE ts.id = $1
	`
	
	var capacity int32
	err := s.db.QueryRow(ctx, query, req.TimeSlotId).Scan(&capacity)
	if err != nil {
		return &pb.UpdateOccupancyResponse{Success: false, ErrorMessage: "Time slot not found"}, nil
	}

	isAvailable := req.BookedCount < capacity
	updateQuery := `
		UPDATE time_slots 
		SET is_available = $1, updated_at = $2
		WHERE id = $3
	`
	_, err = s.db.Exec(ctx, updateQuery, isAvailable, now, req.TimeSlotId)
	if err != nil {
		return &pb.UpdateOccupancyResponse{Success: false, ErrorMessage: err.Error()}, nil
	}

	availableSpots := capacity - req.BookedCount
	status := "open"
	if req.BookedCount >= capacity {
		status = "full"
	}

	return &pb.UpdateOccupancyResponse{
		Success: true,
		TimeSlot: &pb.TimeSlotDetail{
			Id:             req.TimeSlotId,
			Capacity:       capacity,
			BookedCount:    req.BookedCount,
			AvailableSpots: availableSpots,
			IsAvailable:    isAvailable,
			Status:         status,
			UpdatedAt:      now,
		},
	}, nil
}

func (s *InventoryServiceServer) GetAvailability(ctx context.Context, req *pb.GetAvailabilityRequest) (*pb.GetAvailabilityResponse, error) {
	query := `
		SELECT 
			ts.slot_date,
			COUNT(DISTINCT ts.id) as total_slots,
			SUM(CASE WHEN (ts.capacity - COALESCE(booked.count, 0)) > 0 THEN 1 ELSE 0 END) as available_slots,
			SUM(COALESCE(booked.count, 0)) as booked_total,
			SUM(CASE WHEN NOT ts.is_available THEN 1 ELSE 0 END) as blocked_slots
		FROM time_slots ts
		LEFT JOIN (
			SELECT time_slot_id, COUNT(*) as count 
			FROM bookings 
			WHERE status IN ('pending', 'confirmed')
			GROUP BY time_slot_id
		) booked ON ts.id = booked.time_slot_id
		WHERE ts.service_id = $1 AND ts.slot_date BETWEEN $2 AND $3
		GROUP BY ts.slot_date
		ORDER BY ts.slot_date ASC
	`

	rows, err := s.db.Query(ctx, query, req.ServiceId, req.DateFrom, req.DateTo)
	if err != nil {
		return &pb.GetAvailabilityResponse{Success: false, ErrorMessage: err.Error()}, nil
	}
	defer rows.Close()

	var dates []*pb.DateAvailability
	for rows.Next() {
		var date string
		var totalSlots, availableSlots, bookedTotal, blockedSlots int32

		if err := rows.Scan(&date, &totalSlots, &availableSlots, &bookedTotal, &blockedSlots); err != nil {
			log.Printf("Error scanning availability: %v", err)
			continue
		}

		occupancyPct := int32(0)
		if totalSlots > 0 {
			occupancyPct = int32((float32(bookedTotal) / float32(totalSlots*10)) * 100)
		}

		dates = append(dates, &pb.DateAvailability{
			Date:                 date,
			TotalSlots:           totalSlots,
			AvailableSlots:       availableSlots,
			BookedSlots:          int32(bookedTotal),
			BlockedSlots:         blockedSlots,
			OccupancyPercentage:  occupancyPct,
		})
	}

	return &pb.GetAvailabilityResponse{
		Success: true,
		Dates:   dates,
	}, nil
}

func (s *InventoryServiceServer) BlockTimeSlot(ctx context.Context, req *pb.BlockTimeSlotRequest) (*pb.BlockTimeSlotResponse, error) {
	now := time.Now().Format(time.RFC3339)
	query := `
		UPDATE time_slots 
		SET is_available = false, updated_at = $1
		WHERE id = $2
	`

	_, err := s.db.Exec(ctx, query, now, req.TimeSlotId)
	if err != nil {
		return &pb.BlockTimeSlotResponse{Success: false, ErrorMessage: err.Error()}, nil
	}

	return &pb.BlockTimeSlotResponse{
		Success: true,
		TimeSlot: &pb.TimeSlotDetail{
			Id:          req.TimeSlotId,
			IsAvailable: false,
			Status:      "blocked",
			UpdatedAt:   now,
		},
	}, nil
}

func (s *InventoryServiceServer) GetCapacityStatus(ctx context.Context, req *pb.GetCapacityStatusRequest) (*pb.GetCapacityStatusResponse, error) {
	query := `
		SELECT 
			COALESCE(SUM(ts.capacity), 0) as total_capacity,
			COALESCE(SUM(COALESCE(booked.count, 0)), 0) as booked_count,
			COUNT(DISTINCT ts.id) as total_slots
		FROM time_slots ts
		LEFT JOIN (
			SELECT time_slot_id, COUNT(*) as count 
			FROM bookings 
			WHERE status IN ('pending', 'confirmed')
			GROUP BY time_slot_id
		) booked ON ts.id = booked.time_slot_id
		WHERE ts.service_id = $1 AND ts.slot_date = $2
	`

	var totalCapacity, bookedCount, totalSlots int32
	err := s.db.QueryRow(ctx, query, req.ServiceId, req.Date).Scan(&totalCapacity, &bookedCount, &totalSlots)
	if err != nil {
		return &pb.GetCapacityStatusResponse{Success: false, ErrorMessage: err.Error()}, nil
	}

	availableCapacity := totalCapacity - bookedCount
	occupancyPct := int32(0)
	if totalCapacity > 0 {
		occupancyPct = int32((float32(bookedCount) / float32(totalCapacity)) * 100)
	}

	return &pb.GetCapacityStatusResponse{
		Success:            true,
		ServiceId:          req.ServiceId,
		Date:               req.Date,
		TotalCapacity:      totalCapacity,
		Booked:             bookedCount,
		Available:          availableCapacity,
		OccupancyPercentage: occupancyPct,
		TotalSlots:         totalSlots,
	}, nil
}
