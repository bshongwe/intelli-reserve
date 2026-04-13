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

// GetDashboardMetrics returns key KPI metrics for the host dashboard
func (s *AnalyticsServiceServer) GetDashboardMetrics(ctx context.Context, req *pb.GetDashboardMetricsRequest) (*pb.GetDashboardMetricsResponse, error) {
	hostID := req.GetHostId()
	if hostID == "" {
		return &pb.GetDashboardMetricsResponse{Success: false, ErrorMessage: "host_id is required"}, nil
	}

	// Upcoming confirmed bookings
	var upcomingBookings int32
	s.db.QueryRow(ctx,
		`SELECT COUNT(*)::integer FROM bookings WHERE host_id = $1 AND status = 'confirmed'`,
		hostID).Scan(&upcomingBookings)

	// Total released revenue (confirmed + completed)
	var totalRevenue float64
	s.db.QueryRow(ctx,
		`SELECT COALESCE(SUM(s.base_price), 0)::float
		 FROM bookings b JOIN services s ON b.service_id = s.id
		 WHERE b.host_id = $1 AND b.status IN ('confirmed', 'completed')`,
		hostID).Scan(&totalRevenue)

	// Average occupancy rate
	var avgOccupancy float64
	s.db.QueryRow(ctx,
		`SELECT COALESCE(AVG(occupancy), 0)::float FROM (
		   SELECT COUNT(b.id)::float / NULLIF(COUNT(DISTINCT ts.id), 0) * 100 AS occupancy
		   FROM time_slots ts
		   LEFT JOIN bookings b ON ts.id = b.time_slot_id AND b.host_id = $1
		   WHERE ts.service_id IN (SELECT id FROM services WHERE host_id = $1)
		   GROUP BY ts.slot_date
		 ) subq`,
		hostID).Scan(&avgOccupancy)

	// Response rate (confirmed+completed / total)
	var responseRate float64
	s.db.QueryRow(ctx,
		`SELECT COALESCE(
		   COUNT(CASE WHEN status IN ('confirmed', 'completed') THEN 1 END)::float /
		   NULLIF(COUNT(*), 0) * 100, 0)::float
		 FROM bookings WHERE host_id = $1`,
		hostID).Scan(&responseRate)

	// Revenue trend (last 12 months)
	revenueData := []*pb.DataPoint{}
	rows, err := s.db.Query(ctx,
		`SELECT TO_CHAR(DATE_TRUNC('month', b.created_at), 'Mon YYYY') AS month,
		        COALESCE(SUM(s.base_price), 0)::float AS revenue
		 FROM bookings b JOIN services s ON b.service_id = s.id
		 WHERE b.host_id = $1 AND b.status IN ('confirmed', 'completed')
		   AND b.created_at >= NOW() - interval '12 months'
		 GROUP BY DATE_TRUNC('month', b.created_at)
		 ORDER BY DATE_TRUNC('month', b.created_at) ASC`,
		hostID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var month string
			var revenue float64
			if err := rows.Scan(&month, &revenue); err == nil {
				revenueData = append(revenueData, &pb.DataPoint{Label: month, Value: revenue})
			}
		}
	} else {
		log.Printf("Error fetching revenue trend: %v", err)
	}

	// Weekly occupancy (last 7 days by day-of-week)
	occupancyData := []*pb.DataPoint{}
	occRows, err := s.db.Query(ctx,
		`SELECT TO_CHAR(ts.slot_date, 'Dy') AS day,
		        COALESCE(COUNT(b.id)::float / NULLIF(COUNT(DISTINCT ts.id), 0) * 100, 0)::float AS occupancy
		 FROM time_slots ts
		 LEFT JOIN bookings b ON ts.id = b.time_slot_id AND b.host_id = $1
		 WHERE ts.service_id IN (SELECT id FROM services WHERE host_id = $1)
		   AND ts.slot_date >= NOW() - interval '7 days'
		 GROUP BY TO_CHAR(ts.slot_date, 'Dy'), EXTRACT(DOW FROM ts.slot_date)
		 ORDER BY EXTRACT(DOW FROM ts.slot_date)`,
		hostID)
	if err == nil {
		defer occRows.Close()
		for occRows.Next() {
			var day string
			var occupancy float64
			if err := occRows.Scan(&day, &occupancy); err == nil {
				occupancyData = append(occupancyData, &pb.DataPoint{Label: day, Value: occupancy})
			}
		}
	} else {
		log.Printf("Error fetching occupancy data: %v", err)
	}

	return &pb.GetDashboardMetricsResponse{
		Success: true,
		Metrics: &pb.DashboardMetrics{
			UpcomingBookings: upcomingBookings,
			TotalRevenue:     formatCurrency(totalRevenue),
			AvgOccupancy:     avgOccupancy,
			ResponseRate:     responseRate,
			RevenueData:      revenueData,
			OccupancyData:    occupancyData,
		},
	}, nil
}

// GetAnalytics returns comprehensive analytics for the analytics dashboard
func (s *AnalyticsServiceServer) GetAnalytics(ctx context.Context, req *pb.GetAnalyticsRequest) (*pb.GetAnalyticsResponse, error) {
	hostID := req.GetHostId()
	if hostID == "" {
		return &pb.GetAnalyticsResponse{Success: false, ErrorMessage: "host_id is required"}, nil
	}

	months := getMonthsForRange(req.GetTimeRange())

	// Revenue trend
	revenueData := []*pb.DataPoint{}
	rows, err := s.db.Query(ctx,
		`SELECT TO_CHAR(DATE_TRUNC('month', b.created_at), 'Mon YYYY') AS month,
		        COALESCE(SUM(s.base_price), 0)::float AS revenue,
		        COUNT(b.id)::integer AS bookings
		 FROM bookings b JOIN services s ON b.service_id = s.id
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
			var bookings int32
			if err := rows.Scan(&month, &revenue, &bookings); err == nil {
				revenueData = append(revenueData, &pb.DataPoint{Label: month, Value: revenue})
			}
		}
	}

	// Booking status distribution (all time)
	statusData := []*pb.StatusData{}
	sRows, err := s.db.Query(ctx,
		`SELECT status, COUNT(*)::integer AS count FROM bookings WHERE host_id = $1 GROUP BY status`,
		hostID)
	if err == nil {
		defer sRows.Close()
		for sRows.Next() {
			var status string
			var count int32
			if err := sRows.Scan(&status, &count); err == nil {
				statusData = append(statusData, &pb.StatusData{Status: status, Count: count})
			}
		}
	}

	// Top services
	topServices := []*pb.ServiceData{}
	svRows, err := s.db.Query(ctx,
		`SELECT s.id, s.name, COUNT(b.id)::integer AS bookings, COALESCE(SUM(s.base_price), 0)::float AS revenue
		 FROM services s
		 LEFT JOIN bookings b ON b.service_id = s.id AND b.status IN ('confirmed', 'completed')
		 WHERE s.host_id = $1
		 GROUP BY s.id, s.name
		 ORDER BY bookings DESC LIMIT 5`,
		hostID)
	if err == nil {
		defer svRows.Close()
		for svRows.Next() {
			var id, name string
			var bookings int32
			var revenue float64
			if err := svRows.Scan(&id, &name, &bookings, &revenue); err == nil {
				topServices = append(topServices, &pb.ServiceData{
					ServiceId:   id,
					ServiceName: name,
					Bookings:    bookings,
					Revenue:     revenue,
				})
			}
		}
	}

	// Top customers
	topCustomers := []*pb.CustomerData{}
	cRows, err := s.db.Query(ctx,
		`SELECT b.client_name, b.client_email, COUNT(b.id)::integer AS bookings, COALESCE(SUM(s.base_price), 0)::float AS total_spent
		 FROM bookings b JOIN services s ON b.service_id = s.id
		 WHERE b.host_id = $1 AND b.status IN ('confirmed', 'completed')
		 GROUP BY b.client_name, b.client_email
		 ORDER BY total_spent DESC LIMIT 5`,
		hostID)
	if err == nil {
		defer cRows.Close()
		for cRows.Next() {
			var name, email string
			var bookings int32
			var totalSpent float64
			if err := cRows.Scan(&name, &email, &bookings, &totalSpent); err == nil {
				topCustomers = append(topCustomers, &pb.CustomerData{
					CustomerName:  name,
					CustomerEmail: email,
					TotalBookings: bookings,
					TotalSpent:    totalSpent,
				})
			}
		}
	}

	// Aggregate metrics
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
	// Total bookings across all statuses in range
	for _, sd := range statusData {
		totalBookings += sd.Count
	}

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
				AvgRating:       0,
			},
		},
	}, nil
}

// GetRevenueReport returns a revenue report for a date range
func (s *AnalyticsServiceServer) GetRevenueReport(ctx context.Context, req *pb.GetRevenueReportRequest) (*pb.GetRevenueReportResponse, error) {
	hostID := req.GetHostId()
	if hostID == "" {
		return &pb.GetRevenueReportResponse{Success: false, ErrorMessage: "host_id is required"}, nil
	}

	startDate := req.GetStartDate()
	endDate := req.GetEndDate()

	var totalRevenue, completedRevenue, pendingRevenue float64
	s.db.QueryRow(ctx,
		`SELECT COALESCE(SUM(s.base_price), 0)::float FROM bookings b JOIN services s ON b.service_id = s.id
		 WHERE b.host_id = $1 AND b.status IN ('confirmed', 'completed') AND b.created_at BETWEEN $2 AND $3`,
		hostID, startDate, endDate).Scan(&totalRevenue)
	s.db.QueryRow(ctx,
		`SELECT COALESCE(SUM(s.base_price), 0)::float FROM bookings b JOIN services s ON b.service_id = s.id
		 WHERE b.host_id = $1 AND b.status = 'completed' AND b.created_at BETWEEN $2 AND $3`,
		hostID, startDate, endDate).Scan(&completedRevenue)
	s.db.QueryRow(ctx,
		`SELECT COALESCE(SUM(s.base_price), 0)::float FROM bookings b JOIN services s ON b.service_id = s.id
		 WHERE b.host_id = $1 AND b.status = 'pending' AND b.created_at BETWEEN $2 AND $3`,
		hostID, startDate, endDate).Scan(&pendingRevenue)

	dailyRevenue := []*pb.DataPoint{}
	rows, err := s.db.Query(ctx,
		`SELECT TO_CHAR(b.created_at::date, 'YYYY-MM-DD') AS day, COALESCE(SUM(s.base_price), 0)::float AS revenue
		 FROM bookings b JOIN services s ON b.service_id = s.id
		 WHERE b.host_id = $1 AND b.status IN ('confirmed', 'completed') AND b.created_at BETWEEN $2 AND $3
		 GROUP BY b.created_at::date ORDER BY b.created_at::date ASC`,
		hostID, startDate, endDate)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var day string
			var revenue float64
			if err := rows.Scan(&day, &revenue); err == nil {
				dailyRevenue = append(dailyRevenue, &pb.DataPoint{Label: day, Value: revenue})
			}
		}
	} else {
		log.Printf("Error fetching daily revenue: %v", err)
	}

	return &pb.GetRevenueReportResponse{
		Success: true,
		Report: &pb.RevenueReport{
			TotalRevenue:             totalRevenue,
			CompletedBookingsRevenue: completedRevenue,
			PendingBookingsRevenue:   pendingRevenue,
			DailyRevenue:             dailyRevenue,
		},
	}, nil
}

// GetBookingStatistics returns booking counts by status for a time range
func (s *AnalyticsServiceServer) GetBookingStatistics(ctx context.Context, req *pb.GetBookingStatisticsRequest) (*pb.GetBookingStatisticsResponse, error) {
	hostID := req.GetHostId()
	if hostID == "" {
		return &pb.GetBookingStatisticsResponse{Success: false, ErrorMessage: "host_id is required"}, nil
	}

	months := getMonthsForRange(req.GetTimeRange())

	var total, confirmed, pending, cancelled, completed int32
	s.db.QueryRow(ctx, `SELECT COUNT(*)::integer FROM bookings WHERE host_id = $1 AND created_at >= NOW() - ($2 || ' months')::interval`, hostID, months).Scan(&total)
	s.db.QueryRow(ctx, `SELECT COUNT(*)::integer FROM bookings WHERE host_id = $1 AND status = 'confirmed' AND created_at >= NOW() - ($2 || ' months')::interval`, hostID, months).Scan(&confirmed)
	s.db.QueryRow(ctx, `SELECT COUNT(*)::integer FROM bookings WHERE host_id = $1 AND status = 'pending' AND created_at >= NOW() - ($2 || ' months')::interval`, hostID, months).Scan(&pending)
	s.db.QueryRow(ctx, `SELECT COUNT(*)::integer FROM bookings WHERE host_id = $1 AND status = 'cancelled' AND created_at >= NOW() - ($2 || ' months')::interval`, hostID, months).Scan(&cancelled)
	s.db.QueryRow(ctx, `SELECT COUNT(*)::integer FROM bookings WHERE host_id = $1 AND status = 'completed' AND created_at >= NOW() - ($2 || ' months')::interval`, hostID, months).Scan(&completed)

	var completionRate, avgValue float64
	if total > 0 {
		completionRate = float64(completed) / float64(total) * 100
	}
	s.db.QueryRow(ctx,
		`SELECT COALESCE(AVG(s.base_price), 0)::float FROM bookings b JOIN services s ON b.service_id = s.id
		 WHERE b.host_id = $1 AND b.created_at >= NOW() - ($2 || ' months')::interval`,
		hostID, months).Scan(&avgValue)

	return &pb.GetBookingStatisticsResponse{
		Success: true,
		Statistics: &pb.BookingStatistics{
			TotalBookings:         total,
			ConfirmedBookings:     confirmed,
			PendingBookings:       pending,
			CancelledBookings:     cancelled,
			CompletedBookings:     completed,
			BookingCompletionRate: completionRate,
			AvgBookingValue:       avgValue,
		},
	}, nil
}

// Helpers

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
