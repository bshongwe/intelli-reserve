package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	pb "github.com/intelli-reserve/backend/gen/go/escrow"
	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/grpc"
)

// ============================================================================
// TYPES
// ============================================================================

// HealthResponse represents the health check response
type HealthResponse struct {
	Status    string `json:"status"`
	Service   string `json:"service"`
	Version   string `json:"version"`
	Timestamp string `json:"timestamp"`
}

// ============================================================================
// GLOBALS
// ============================================================================

var (
	dbPool *pgxpool.Pool
	logger *log.Logger
)

// ============================================================================
// MAIN
// ============================================================================

func main() {
	// Initialize logger
	logger = log.New(os.Stdout, "["+ServiceName+"] ", log.LstdFlags|log.Lshortfile)
	logger.Printf("Starting %s v%s", ServiceName, ServiceVersion)

	// Get database configuration from environment
	dbConfig := getDatabaseConfig()

	// Create database connection pool
	var err error
	dbPool, err = pgxpool.New(context.Background(), dbConfig)
	if err != nil {
		logger.Fatalf("Unable to create database pool: %v", err)
	}
	defer dbPool.Close()

	// Verify database connection
	if err := dbPool.Ping(context.Background()); err != nil {
		logger.Fatalf("Unable to ping database: %v", err)
	}
	logger.Println("✓ Database connection established")

	// Create gRPC server
	grpcServer := grpc.NewServer()
	payoutService := &PayoutService{db: dbPool}
	pb.RegisterEscrowServiceServer(grpcServer, payoutService)
	logger.Println("✓ gRPC service registered")

	// Start HTTP health check server
	go startHealthCheckServer()

	// Start gRPC server
	listener, err := net.Listen("tcp", GRPCPort)
	if err != nil {
		logger.Fatalf("Failed to listen on %s: %v", GRPCPort, err)
	}
	logger.Printf("✓ gRPC server listening on %s", GRPCPort)

	// Handle graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		sig := <-sigChan

		logger.Printf("Received signal %v, shutting down gracefully", sig)
		grpcServer.GracefulStop()
		dbPool.Close()
		logger.Println("✓ Shutdown complete")
		os.Exit(0)
	}()

	// Start gRPC server (blocking)
	if err := grpcServer.Serve(listener); err != nil {
		logger.Fatalf("gRPC server failed: %v", err)
	}
}

// ============================================================================
// HEALTH CHECK SERVER
// ============================================================================

func startHealthCheckServer() {
	http.HandleFunc("/health", handleHealthCheck)
	logger.Printf("✓ Health check server listening on %s", HTTPPort)

	if err := http.ListenAndServe(HTTPPort, nil); err != nil {
		logger.Printf("Health check server error: %v", err)
	}
}

func handleHealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Check database connectivity
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if err := dbPool.Ping(ctx); err != nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(HealthResponse{
			Status:    "unhealthy",
			Service:   ServiceName,
			Version:   ServiceVersion,
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(HealthResponse{
		Status:    "healthy",
		Service:   ServiceName,
		Version:   ServiceVersion,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

func getDatabaseConfig() string {
	// Read environment variables with defaults
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}

	dbPort := os.Getenv("DB_PORT")
	if dbPort == "" {
		dbPort = "5432"
	}

	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "postgres"
	}

	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		dbPassword = "postgres"
	}

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "intelli_reserve"
	}

	// Build connection string
	connStr := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		dbUser,
		dbPassword,
		dbHost,
		dbPort,
		dbName,
	)

	logger.Printf("Connecting to database: %s@%s:%s/%s",
		dbUser,
		dbHost,
		dbPort,
		dbName,
	)

	return connStr
}

// ============================================================================
// PAYOUT SERVICE IMPLEMENTATION
// ============================================================================

// PayoutService implements the gRPC EscrowService interface for payouts
type PayoutService struct {
	pb.UnimplementedEscrowServiceServer
	db *pgxpool.Pool
}

// Note: Handler methods (RequestPayout, GetPayoutStatus, etc.) are defined
// in grpc_handlers.go to keep this file focused on server setup.
