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

	pb "github.com/intelli-reserve/backend/gen/go/notification"
	"github.com/jackc/pgx/v5"
	"google.golang.org/grpc"
)

const (
	httpPort = ":8084"
	grpcPort = ":8094"
)

func main() {
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

	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s", dbUser, dbPassword, dbHost, dbPort, dbName)
	conn, err := pgx.Connect(context.Background(), connStr)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer conn.Close(context.Background())

	log.Printf("✅ Notification Service connected to PostgreSQL DB")

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Start HTTP REST API server (port 8084)
	go startHTTPServer()

	// Start gRPC server (port 8094)
	go startGRPCServer(conn)

	// Wait for shutdown signal
	<-sigChan
	log.Printf("🛑 Shutdown signal received")
}

// startHTTPServer starts the REST API server on port 8084
func startHTTPServer() {
	http.HandleFunc("/health", healthHandler)

	port := httpPort
	log.Printf("🚀 Notification Service REST API server running on %s", port)

	if err := http.ListenAndServe(port, nil); err != nil && err != http.ErrServerClosed {
		log.Fatalf("HTTP Server error: %v", err)
	}
}

// healthHandler returns health status
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "healthy",
		"service": "notification-service",
		"grpc":    "available on " + grpcPort,
	})
}

// startGRPCServer starts the gRPC server on port 8094
func startGRPCServer(db *pgx.Conn) {
	listener, err := net.Listen("tcp", grpcPort)
	if err != nil {
		log.Fatalf("Failed to listen for gRPC: %v", err)
	}

	s := grpc.NewServer()
	pb.RegisterNotificationServiceServer(s, NewNotificationServiceServer(db))

	log.Printf("🚀 Notification Service gRPC server running on %s", grpcPort)
	if err := s.Serve(listener); err != nil {
		log.Fatalf("gRPC Server error: %v", err)
	}
}
