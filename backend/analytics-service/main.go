package main

import (
	"context"
	"encoding/json"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	pb "github.com/intelli-reserve/backend/gen/go/analytics"
	"github.com/jackc/pgx/v5"
	"google.golang.org/grpc"
)

const (
	contentTypeHeader = "Content-Type"
	contentTypeJSON   = "application/json"
	httpPort          = ":8081"
	grpcPort          = ":8091"
)

var dbConn *pgx.Conn

func main() {
	// Connect to database
	connStr := "postgres://postgres:postgres@localhost:5432/intelli_reserve"
	conn, err := pgx.Connect(context.Background(), connStr)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer conn.Close(context.Background())

	dbConn = conn
	log.Printf("✅ Connected to PostgreSQL database")

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Start HTTP REST API server (port 8081)
	go startHTTPServer()

	// Start gRPC server (port 8091)
	go startGRPCServer()

	// Wait for shutdown signal
	<-sigChan
	log.Printf("🛑 Shutdown signal received")
}

// startHTTPServer starts the REST API server on port 8081
func startHTTPServer() {
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/v1/analytics/dashboard", dashboardMetricsHandler)
	http.HandleFunc("/v1/analytics/revenue", revenueReportHandler)

	log.Printf("🚀 REST API server running on %s", httpPort)

	if err := http.ListenAndServe(httpPort, nil); err != nil && err != http.ErrServerClosed {
		log.Fatalf("HTTP Server error: %v", err)
	}
}

// startGRPCServer starts the gRPC server on port 8091
func startGRPCServer() {
	listener, err := net.Listen("tcp", grpcPort)
	if err != nil {
		log.Fatalf("Failed to listen for gRPC: %v", err)
	}

	s := grpc.NewServer()
	analyticsServer := NewAnalyticsServiceServer(dbConn)
	pb.RegisterAnalyticsServiceServer(s, analyticsServer)

	log.Printf("🚀 gRPC server running on %s", grpcPort)

	if err := s.Serve(listener); err != nil {
		log.Fatalf("gRPC Server error: %v", err)
	}
}

// HTTP Handlers

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set(contentTypeHeader, contentTypeJSON)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "healthy",
		"service": "analytics-service",
		"port":    8091,
	})
}

type DashboardResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Metrics interface{} `json:"metrics,omitempty"`
}

func dashboardMetricsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	hostID := r.URL.Query().Get("host_id")
	if hostID == "" {
		w.Header().Set(contentTypeHeader, contentTypeJSON)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(DashboardResponse{
			Success: false,
			Message: "host_id query parameter required",
		})
		return
	}

	// Call gRPC handler through the server
	ctx := context.Background()
	server := NewAnalyticsServiceServer(dbConn)
	response, err := server.GetDashboardMetrics(ctx, &pb.GetDashboardMetricsRequest{
		HostId: hostID,
	})

	if err != nil {
		w.Header().Set(contentTypeHeader, contentTypeJSON)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(DashboardResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	w.Header().Set(contentTypeHeader, contentTypeJSON)
	json.NewEncoder(w).Encode(DashboardResponse{
		Success: response.Success,
		Metrics: response.Metrics,
	})
}

func revenueReportHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	hostID := r.URL.Query().Get("host_id")
	timeRange := r.URL.Query().Get("time_range")

	if hostID == "" {
		w.Header().Set(contentTypeHeader, contentTypeJSON)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(DashboardResponse{
			Success: false,
			Message: "host_id query parameter required",
		})
		return
	}

	if timeRange == "" {
		timeRange = "6m"
	}

	ctx := context.Background()
	server := NewAnalyticsServiceServer(dbConn)
	response, err := server.GetRevenueReport(ctx, &pb.GetRevenueReportRequest{
		HostId:    hostID,
		TimeRange: timeRange,
	})

	if err != nil {
		w.Header().Set(contentTypeHeader, contentTypeJSON)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(DashboardResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	w.Header().Set(contentTypeHeader, contentTypeJSON)
	json.NewEncoder(w).Encode(DashboardResponse{
		Success: response.Success,
		Metrics: response.RevenueData,
	})
}
