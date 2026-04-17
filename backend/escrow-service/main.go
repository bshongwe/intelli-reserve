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

	pb "github.com/intelli-reserve/backend/gen/go/escrow"
	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/grpc"
)

const (
	httpPort = ":8086"
	grpcPort = ":8096"
)

type HealthResponse struct {
	Status    string `json:"status"`
	Service   string `json:"service"`
	Timestamp string `json:"timestamp"`
}

func main() {
	// Read environment variables
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
	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s", dbUser, dbPassword, dbHost, dbPort, dbName)

	// Create connection pool
	poolConfig, err := pgxpool.ParseConfig(connStr)
	if err != nil {
		log.Fatalf("Unable to parse connection config: %v", err)
	}

	// Set connection pool size
	poolConfig.MaxConns = 25
	poolConfig.MinConns = 5

	conn, err := pgxpool.NewWithConfig(context.Background(), poolConfig)
	if err != nil {
		log.Fatalf("Unable to create connection pool: %v", err)
	}
	defer conn.Close()

	log.Printf("✅ Escrow Service connected to PostgreSQL DB")

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Start HTTP server
	go startHTTPServer()

	// Start gRPC server
	go startGRPCServer(conn)

	// Wait for shutdown signal
	<-sigChan
	log.Printf("🛑 Shutdown signal received")
}

// startHTTPServer starts the REST API server for health checks
func startHTTPServer() {
	http.HandleFunc("/health", healthHandler)

	log.Printf("🚀 Escrow Service HTTP server running on %s", httpPort)

	if err := http.ListenAndServe(httpPort, nil); err != nil && err != http.ErrServerClosed {
		log.Fatalf("HTTP Server error: %v", err)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	resp := HealthResponse{
		Status:    "healthy",
		Service:   "escrow-service",
		Timestamp: "2026-04-17T00:00:00Z",
	}
	json.NewEncoder(w).Encode(resp)
}

// startGRPCServer starts the gRPC server
func startGRPCServer(pool *pgxpool.Pool) {
	listener, err := net.Listen("tcp", grpcPort)
	if err != nil {
		log.Fatalf("Failed to listen for gRPC: %v", err)
	}

	s := grpc.NewServer()
	pb.RegisterEscrowServiceServer(s, NewEscrowServiceServer(pool))

	log.Printf("🚀 Escrow Service gRPC server running on %s", grpcPort)
	if err := s.Serve(listener); err != nil {
		log.Fatalf("gRPC Server error: %v", err)
	}
}
