package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	pb "github.com/intelli-reserve/backend/gen/go/analytics"
	"github.com/jackc/pgx/v5"
	"google.golang.org/protobuf/types/known/structpb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type AnalyticsServiceServer struct {
	pb.UnimplementedAnalyticsServiceServer
	db *pgx.Conn
}

func NewAnalyticsServiceServer(db *pgx.Conn) *AnalyticsServiceServer {
	return &AnalyticsServiceServer{db: db}
}

// GetDashboardMetrics returns key metrics for a host's dashboard
func (s *AnalyticsServiceServer) GetDashboardMetrics(ctx context.Context, req *pb.GetDashboardMetricsRequest) (*pb.GetDashboardMetricsResponse, error) {
	hostID := req.GetHostId()

	// Get upcoming bookings count
	var upcomingBookings int32
	err := s.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM bookings 
		 WHERE host_id = $1 AND status = 'confirmed' 
		 AND created_at > NOW()`,
		hostID).Scan(&upcomingBookings)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("Error fetching upcoming bookings: %v", err)
		return &pb.GetDashboardMetricsResponse{
			Success:      false,
			ErrorMessage: "Failed to fetch upcoming bookings",
		}, nil
	}

	// Get total revenue (confirmed + completed bookings)
	var totalRevenue float64
	err = s.db.QueryRow(ctx,
		`SELECT COALESCE(SUM(s.base_price), 0)::float
		 FROM bookings b
		 JOIN services s ON b.service_id = s.id
		 WHERE b.host_id = $1 AND b.status IN ('confirmed', 'completed')`,
		hostID).Scan(&totalRevenue)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("Error fetching total revenue: %v", err)
		return &pb.GetDashboardMetricsResponse{
			Success:      false,
			ErrorMessage: "Failed to fetch revenue data",
		}, nil
	}

	// Get average occupancy (bookings per available slot)
	var avgOccupancy float64
	err = s.db.QueryRow(ctx,
		`SELECT COALESCE(AVG(occupancy), 0)::float FROM (
		   SELECT COUNT(b.id)::float / NULLIF(COUNT(DISTINCT ts.id), 0) * 100 as occupancy
		   FROM time_slots ts
		   LEFT JOIN bookings b ON ts.id = b.time_slot_id AND b.host_id = $1
		   WHERE ts.service_id IN (SELECT id FROM services WHERE host_id = $1)
		   GROUP BY ts.slot_date
		 ) subq`,
		hostID).Scan(&avgOccupancy)
	if err != nil && err != sql.ErrNoRows {
		avgOccupancy = 0
		log.Printf("Error fetching occupancy: %v", err)
	}

	// Get response rate (confirmed bookings / total inquiries)
	var responseRate float64
	err = s.db.QueryRow(ctx,
		`SELECT COALESCE(
		   COUNT(CASE WHEN status IN ('confirmed', 'completed') THEN 1 END)::float / 
		   NULLIF(COUNT(*), 0) * 100, 0)::float
		 FROM bookings
		 WHERE host_id = $1`,
		hostID).Scan(&responseRate)
	if err != nil && err != sql.ErrNoRows {
		responseRate = 0
		log.Printf("Error fetching response rate: %v", err)
	}

	// Get revenue trend data (last 12 months)
	revenueData := []*pb.DataPoint{}
	rows, err := s.db.Query(ctx,
		`SELECT 
		   TO_CHAR(DATE_TRUNC('month', b.created_at), 'Mon YYYY') AS month,
		   COALESCE(SUM(s.base_price), 0)::float AS revenue
		 FROM bookings b
		 JOIN services s ON b.service_id = s.id
		 WHERE b.host_id = $1 AND b.status IN ('confirmed', 'completed')
		 AND b.created_at >= NOW() - interval '12 months'
		 GROUP BY DATE_TRUNC('month', b.created_at)
		 ORDER BY DATE_TRUNC('month', b.created_at) ASC`,
		hostID)
	if err != nil {
		log.Printf("Error fetching revenue trend: %v", err)
	} else {
		defer rows.Close()
		for rows.Next() {
			var month string
			var revenue float64
			if err := rows.Scan(&month, &revenue); err == nil {
				revenueData = append(revenueData, &pb.DataPoint{
					Label: month,
					Value: revenue,
				})
			}
		}
	}

	// Build response
	metrics := &pb.DashboardMetrics{
		UpcomingBookings: upcomingBookings,
		TotalRevenue:     formatCurrency(totalRevenue),
		AvgOccupancy:     avgOccupancy,
		ResponseRate:     responseRate,
		RevenueData:      revenueData,
	}

	return &pb.GetDashboardMetricsResponse{
		Success: true,
		Metrics: metrics,
	}, nil
}

// GetAnalytics returns comprehensive analytics data
func (s *AnalyticsServiceServer) GetAnalytics(ctx context.Context, req *pb.GetAnalyticsRequest) (*pb.GetAnalyticsResponse, error) {
	hostID := req.GetHostId()
	timeRange := req.GetTimeRange()

	if timeRange == "" {
		timeRange = "6m"
	}

	months := getMonthsForRange(timeRange)

	// Revenue trend
	revenueData := []*pb.DataPoint{}
	rows, err := s.db.Query(ctx,
		`SELECT 
		   TO_CHAR(DATE_TRUNC('month', b.created_at), 'Mon YYYY') AS month,
		   COALESCE(SUM(s.base_price), 0)::float AS revenue,
		   COUNT(b.id)::integer AS bookings
		 FROM bookings b
		 JOIN services s ON b.service_id = s.id
		 WHERE b.host_id = $1 AND b.status IN ('confirmed', 'completed')
		 AND b.created_at >= NOW() - ($2 || ' months')::interval
		 GROUP BY DATE_TRUNC('month', b.created_at)
		 ORDER BY DATE_TRUNC('month', b.created_at) ASC`,
		hostID, months)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var month string
			var revenue float64
			var bookings int64
			if err := rows.Scan(&month, &revenue, &bookings); err == nil {
				revenueData = append(revenueData, &pb.DataPoint{
					Label: month,
					Value: revenue,
				})
			}
		}
	}

	// Booking status distribution
	statusData := []*pb.DataPoint{}
	rows, err = s.db.Query(ctx,
		`SELECT status, COUNT(*)::integer as count
		 FROM bookings WHERE host_id = $1
		 GROUP BY status`,
		hostID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var status string
			var count int64
			if err := rows.Scan(&status, &count); err == nil {
				statusData = append(statusData, &pb.DataPoint{
					Label: status,
					Value: float64(count),
				})
			}
		}
	}

	// Top services
	topServices := []*pb.ServiceStat{}
	rows, err = s.db.Query(ctx,
		`SELECT s.id, s.name, COUNT(b.id)::integer as bookings, COALESCE(SUM(s.base_price), 0)::float as revenue
		 FROM services s
		 LEFT JOIN bookings b ON b.service_id = s.id AND b.status IN ('confirmed', 'completed')
		 WHERE s.host_id = $1
		 GROUP BY s.id, s.name
		 ORDER BY bookings DESC LIMIT 5`,
		hostID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var id, name string
			var bookings int64
			var revenue float64
			if err := rows.Scan(&id, &name, &bookings, &revenue); err == nil {
				topServices = append(topServices, &pb.ServiceStat{
					Id:       id,
					Name:     name,
					Bookings: int32(bookings),
					Revenue:  revenue,
				})
			}
		}
	}

	// Total revenue in range
	var totalRevenue float64
	s.db.QueryRow(ctx,
		`SELECT COALESCE(SUM(s.base_price), 0)::float
		 FROM bookings b
		 JOIN services s ON b.service_id = s.id
		 WHERE b.host_id = $1 AND b.status IN ('confirmed', 'completed')
		 AND b.created_at >= NOW() - ($2 || ' months')::interval`,
		hostID, months).Scan(&totalRevenue)

	// Active customers
	var activeCustomers int32
	s.db.QueryRow(ctx,
		`SELECT COUNT(DISTINCT client_email)::integer
		 FROM bookings
		 WHERE host_id = $1 AND status IN ('confirmed', 'completed')
		 AND created_at >= NOW() - ($2 || ' months')::interval`,
		hostID, months).Scan(&activeCustomers)

	// Total bookings
	var totalBookings int32
	s.db.QueryRow(ctx,
		`SELECT COUNT(*)::integer FROM bookings
		 WHERE host_id = $1 AND status IN ('confirmed', 'completed')
		 AND created_at >= NOW() - ($2 || ' months')::interval`,
		hostID, months).Scan(&totalBookings)

	analyticsData := &pb.Analytics{
		RevenueData:      revenueData,
		StatusData:       statusData,
		TopServices:     topServices,
		TotalRevenue:     formatCurrency(totalRevenue),
		TotalBookings:    totalBookings,
		ActiveCustomers: activeCustomers,
		AvgRating:        0, // Placeholder until ratings feature is built
	}

	return &pb.GetAnalyticsResponse{
		Success:    true,
		Analytics: analyticsData,
	}, nil
}

// GetRevenueReport returns detailed revenue report
func (s *AnalyticsServiceServer) GetRevenueReport(ctx context.Context, req *pb.GetRevenueReportRequest) (*pb.GetRevenueReportResponse, error) {
	hostID := req.GetHostId()
	timeRange := req.GetTimeRange()

	if timeRange == "" {
		timeRange = "6m"
	}

	months := getMonthsForRange(timeRange)

	revenueData := []*pb.DataPoint{}
	rows, err := s.db.Query(ctx,
		`SELECT 
		   TO_CHAR(DATE_TRUNC('month', b.created_at), 'Mon YYYY') AS month,
		   COALESCE(SUM(s.base_price), 0)::float AS revenue
		 FROM bookings b
		 JOIN services s ON b.service_id = s.id
		 WHERE b.host_id = $1 AND b.status IN ('confirmed', 'completed')
		 AND b.created_at >= NOW() - ($2 || ' months')::interval
		 GROUP BY DATE_TRUNC('month', b.created_at)
		 ORDER BY DATE_TRUNC('month', b.created_at) ASC`,
		hostID, months)

	if err != nil {
		log.Printf("Error fetching revenue report: %v", err)
		return &pb.GetRevenueReportResponse{
			Success:      false,
			ErrorMessage: "Failed to fetch revenue data",
		}, nil
	}

	defer rows.Close()
	for rows.Next() {
		var month string
		var revenue float64
		if err := rows.Scan(&month, &revenue); err == nil {
			revenueData = append(revenueData, &pb.DataPoint{
				Label: month,
				Value: revenue,
			})
		}
	}

	return &pb.GetRevenueReportResponse{
		Success:     true,
		RevenueData: revenueData,
	}, nil
}

// GetBookingStatistics returns booking statistics
func (s *AnalyticsServiceServer) GetBookingStatistics(ctx context.Context, req *pb.GetBookingStatisticsRequest) (*pb.GetBookingStatisticsResponse, error) {
	hostID := req.GetHostId()
	timeRange := req.GetTimeRange()

	if timeRange == "" {
		timeRange = "6m"
	}

	months := getMonthsForRange(timeRange)

	var totalBookings, confirmedBookings, completedBookings, cancelledBookings int32

	s.db.QueryRow(ctx, `SELECT COUNT(*)::integer FROM bookings WHERE host_id = $1 AND created_at >= NOW() - ($2 || ' months')::interval`, hostID, months).Scan(&totalBookings)
	s.db.QueryRow(ctx, `SELECT COUNT(*)::integer FROM bookings WHERE host_id = $1 AND status = 'confirmed' AND created_at >= NOW() - ($2 || ' months')::interval`, hostID, months).Scan(&confirmedBookings)
	s.db.QueryRow(ctx, `SELECT COUNT(*)::integer FROM bookings WHERE host_id = $1 AND status = 'completed' AND created_at >= NOW() - ($2 || ' months')::interval`, hostID, months).Scan(&completedBookings)
	s.db.QueryRow(ctx, `SELECT COUNT(*)::integer FROM bookings WHERE host_id = $1 AND status = 'cancelled' AND created_at >= NOW() - ($2 || ' months')::interval`, hostID, months).Scan(&cancelledBookings)

	return &pb.GetBookingStatisticsResponse{
		Success:           true,
		TotalBookings:     totalBookings,
		ConfirmedBookings: confirmedBookings,
		CompletedBookings: completedBookings,
		CancelledBookings: cancelledBookings,
	}, nil
}

// Helper functions

func formatCurrency(amount float64) string {
	return "R" + formatFloat(amount)
}

func formatFloat(f float64) string {
	return formatFloat64(f, 2)
}

func formatFloat64(f float64, precision int) string {
	format := "%." + string(rune(48+precision)) + "f"
	return fmt.Sprintf(format, f)
}

func getMonthsForRange(timeRange string) int {
	switch timeRange {
	case "1m":
		return 1
	case "3m":
		return 3
	case "1y":
		return 12
	default:
		return 6
	}
}
