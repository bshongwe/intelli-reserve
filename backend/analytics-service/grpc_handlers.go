package main

import (
	"context"
	"fmt"
	"log"

	pb "github.com/intelli-reserve/backend/gen/go/analytics"
	"github.com/jackc/pgx/v5"
)

type AnalyticsServiceServer struct {
	pb.UnimplementedAnalyticsServiceServer
	db *pgx.Conn
}

func NewAnalyticsServiceServer(db *pgx.Conn) *AnalyticsServiceServer {
	return &AnalyticsServiceServer{db: db}
}

// GetDashboardMetrics returns KPI metrics for the host dashboard
func (s *AnalyticsServiceServer) GetDashboardMetrics(ctx context.Context, req *pb.GetDashboardMetricsRequest) (*pb.GetDashboardMetricsResponse, error) {
	hostID := req.GetHostId()

	var upcomingBookings int32
	err := s.db.QueryRow(ctx,
		`SELECT COUNT(*)::integer FROM bookings
		 WHERE host_id = $1 AND status IN ('pending', 'confirmed')`,
		hostID).Scan(&upcomingBookings)
	if err != nil {
		log.Printf("Error fetching upcoming bookings: %v", err)
	}

	var totalRevenue float64
	err = s.db.QueryRow(ctx,
		`SELECT COALESCE(SUM(s.base_price), 0)::float
		 FROM bookings b
		 JOIN services s ON b.service_id = s.id
		 WHERE b.host_id = $1 AND b.status = 'completed'`,
		hostID).Scan(&totalRevenue)
	if err != nil {
		log.Printf("Error fetching total revenue: %v", err)
	}

	var avgOccupancy float64
	err = s.db.QueryRow(ctx,
		`SELECT COALESCE(AVG(subq.occupancy_rate), 0)::float FROM (
		   SELECT CASE WHEN s.max_participants > 0
		     THEN (COALESCE(ts.booked_count, 0)::float / s.max_participants * 100)
		     ELSE 0 END AS occupancy_rate
		   FROM time_slots ts
		   JOIN services s ON s.id = ts.service_id
		   WHERE s.host_id = $1
		 ) subq`,
		hostID).Scan(&avgOccupancy)
	if err != nil {
		avgOccupancy = 0
		log.Printf("Error fetching occupancy: %v", err)
	}

	var responseRate float64
	err = s.db.QueryRow(ctx,
		`SELECT COALESCE(
		   COUNT(CASE WHEN status IN ('confirmed', 'completed') THEN 1 END)::float /
		   NULLIF(COUNT(*), 0) * 100, 0)::float
		 FROM bookings
		 WHERE host_id = $1`,
		hostID).Scan(&responseRate)
	if err != nil {
		responseRate = 0
		log.Printf("Error fetching response rate: %v", err)
	}

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
				revenueData = append(revenueData, &pb.DataPoint{Label: month, Value: revenue})
			}
		}
	}

	return &pb.GetDashboardMetricsResponse{
		Success: true,
		Metrics: &pb.DashboardMetrics{
			UpcomingBookings: upcomingBookings,
			TotalRevenue:     formatCurrency(totalRevenue),
			AvgOccupancy:     avgOccupancy,
			ResponseRate:     responseRate,
			RevenueData:      revenueData,
		},
	}, nil
}

// GetAnalytics returns comprehensive analytics data
func (s *AnalyticsServiceServer) GetAnalytics(ctx context.Context, req *pb.GetAnalyticsRequest) (*pb.GetAnalyticsResponse, error) {
	hostID := req.GetHostId()
	months := getMonthsForRange(req.GetTimeRange())

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
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var month string
			var revenue float64
			if err := rows.Scan(&month, &revenue); err == nil {
				revenueData = append(revenueData, &pb.DataPoint{Label: month, Value: revenue})
			}
		}
	}

	statusData := []*pb.StatusData{}
	rows, err = s.db.Query(ctx,
		`SELECT status, COUNT(*)::integer as count
		 FROM bookings WHERE host_id = $1
		 GROUP BY status`,
		hostID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var st string
			var count int32
			if err := rows.Scan(&st, &count); err == nil {
				statusData = append(statusData, &pb.StatusData{Status: st, Count: count})
			}
		}
	}

	topServices := []*pb.ServiceData{}
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
			var bookings int32
			var revenue float64
			if err := rows.Scan(&id, &name, &bookings, &revenue); err == nil {
				topServices = append(topServices, &pb.ServiceData{
					ServiceId: id, ServiceName: name, Bookings: bookings, Revenue: revenue,
				})
			}
		}
	}

	topCustomers := []*pb.CustomerData{}
	rows, err = s.db.Query(ctx,
		`SELECT client_name, client_email, COUNT(*)::integer as bookings, COALESCE(SUM(s.base_price), 0)::float as spent
		 FROM bookings b
		 JOIN services s ON b.service_id = s.id
		 WHERE b.host_id = $1 AND b.status IN ('confirmed', 'completed')
		 AND b.created_at >= NOW() - ($2 || ' months')::interval
		 GROUP BY client_name, client_email
		 ORDER BY bookings DESC LIMIT 5`,
		hostID, months)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var name, email string
			var bookings int32
			var spent float64
			if err := rows.Scan(&name, &email, &bookings, &spent); err == nil {
				topCustomers = append(topCustomers, &pb.CustomerData{
					CustomerName: name, CustomerEmail: email, TotalBookings: bookings, TotalSpent: spent,
				})
			}
		}
	}

	var totalRevenue float64
	var activeCustomers, totalBookings int32
	s.db.QueryRow(ctx,
		`SELECT COALESCE(SUM(s.base_price), 0)::float
		 FROM bookings b JOIN services s ON b.service_id = s.id
		 WHERE b.host_id = $1 AND b.status IN ('confirmed', 'completed')
		 AND b.created_at >= NOW() - ($2 || ' months')::interval`,
		hostID, months).Scan(&totalRevenue)
	s.db.QueryRow(ctx,
		`SELECT COUNT(DISTINCT client_email)::integer FROM bookings
		 WHERE host_id = $1 AND status IN ('confirmed', 'completed')
		 AND created_at >= NOW() - ($2 || ' months')::interval`,
		hostID, months).Scan(&activeCustomers)
	s.db.QueryRow(ctx,
		`SELECT COUNT(*)::integer FROM bookings
		 WHERE host_id = $1 AND status IN ('confirmed', 'completed')
		 AND created_at >= NOW() - ($2 || ' months')::interval`,
		hostID, months).Scan(&totalBookings)

	return &pb.GetAnalyticsResponse{
		Success: true,
		Data: &pb.AnalyticsData{
			RevenueData:       revenueData,
			BookingStatusData: statusData,
			TopServices:       topServices,
			TopCustomers:      topCustomers,
			Metrics: &pb.Metrics{
				TotalRevenue:    formatCurrency(totalRevenue),
				TotalBookings:   totalBookings,
				ActiveCustomers: activeCustomers,
			},
		},
	}, nil
}

// GetRevenueReport returns detailed revenue report
func (s *AnalyticsServiceServer) GetRevenueReport(ctx context.Context, req *pb.GetRevenueReportRequest) (*pb.GetRevenueReportResponse, error) {
	hostID := req.GetHostId()
	months := 6

	var totalRevenue float64
	s.db.QueryRow(ctx,
		`SELECT COALESCE(SUM(s.base_price), 0)::float
		 FROM bookings b JOIN services s ON b.service_id = s.id
		 WHERE b.host_id = $1 AND b.status IN ('confirmed', 'completed')
		 AND b.created_at >= NOW() - ($2 || ' months')::interval`,
		hostID, months).Scan(&totalRevenue)

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
			revenueData = append(revenueData, &pb.DataPoint{Label: month, Value: revenue})
		}
	}

	return &pb.GetRevenueReportResponse{
		Success: true,
		Report: &pb.RevenueReport{
			TotalRevenue:             totalRevenue,
			CompletedBookingsRevenue: totalRevenue,
			PendingBookingsRevenue:   0,
			DailyRevenue:             revenueData,
		},
	}, nil
}

// GetBookingStatistics returns booking statistics
func (s *AnalyticsServiceServer) GetBookingStatistics(ctx context.Context, req *pb.GetBookingStatisticsRequest) (*pb.GetBookingStatisticsResponse, error) {
	hostID := req.GetHostId()
	months := getMonthsForRange(req.GetTimeRange())

	var totalBookings, confirmedBookings, completedBookings, cancelledBookings, pendingBookings int32
	s.db.QueryRow(ctx, `SELECT COUNT(*)::integer FROM bookings WHERE host_id = $1 AND created_at >= NOW() - ($2 || ' months')::interval`, hostID, months).Scan(&totalBookings)
	s.db.QueryRow(ctx, `SELECT COUNT(*)::integer FROM bookings WHERE host_id = $1 AND status = 'confirmed' AND created_at >= NOW() - ($2 || ' months')::interval`, hostID, months).Scan(&confirmedBookings)
	s.db.QueryRow(ctx, `SELECT COUNT(*)::integer FROM bookings WHERE host_id = $1 AND status = 'completed' AND created_at >= NOW() - ($2 || ' months')::interval`, hostID, months).Scan(&completedBookings)
	s.db.QueryRow(ctx, `SELECT COUNT(*)::integer FROM bookings WHERE host_id = $1 AND status = 'cancelled' AND created_at >= NOW() - ($2 || ' months')::interval`, hostID, months).Scan(&cancelledBookings)
	s.db.QueryRow(ctx, `SELECT COUNT(*)::integer FROM bookings WHERE host_id = $1 AND status = 'pending' AND created_at >= NOW() - ($2 || ' months')::interval`, hostID, months).Scan(&pendingBookings)

	var completionRate, avgValue float64
	if totalBookings > 0 {
		completionRate = float64(completedBookings) / float64(totalBookings) * 100
	}
	s.db.QueryRow(ctx,
		`SELECT COALESCE(AVG(s.base_price), 0)::float
		 FROM bookings b JOIN services s ON b.service_id = s.id
		 WHERE b.host_id = $1 AND b.status IN ('confirmed', 'completed')
		 AND b.created_at >= NOW() - ($2 || ' months')::interval`,
		hostID, months).Scan(&avgValue)

	return &pb.GetBookingStatisticsResponse{
		Success: true,
		Statistics: &pb.BookingStatistics{
			TotalBookings:         totalBookings,
			ConfirmedBookings:     confirmedBookings,
			PendingBookings:       pendingBookings,
			CancelledBookings:     cancelledBookings,
			CompletedBookings:     completedBookings,
			BookingCompletionRate: completionRate,
			AvgBookingValue:       avgValue,
		},
	}, nil
}

func formatCurrency(amount float64) string {
	return fmt.Sprintf("R%.2f", amount)
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
