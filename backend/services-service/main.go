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

	pb "github.com/intelli-reserve/backend/gen/go/services"
	"github.com/jackc/pgx/v5"
	"google.golang.org/grpc"
)

const (
	httpPort = ":8083"
	grpcPort = ":8093"
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
	log.Printf("✅ Services Service connected to PostgreSQL")

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go startHTTPServer()
	go startGRPCServer(conn)

	<-sigChan
	log.Printf("🛑 Shutdown signal received")
}

func startHTTPServer() {
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "healthy",
			"service": "services-service",
			"grpc":    "available on " + grpcPort,
		})
	})

	log.Printf("🚀 Services Service REST API running on %s", httpPort)
	if err := http.ListenAndServe(httpPort, nil); err != nil && err != http.ErrServerClosed {
		log.Fatalf("HTTP Server error: %v", err)
	}
}

func startGRPCServer(db *pgx.Conn) {
	listener, err := net.Listen("tcp", grpcPort)
	if err != nil {
		log.Fatalf("Failed to listen for gRPC: %v", err)
	}

	s := grpc.NewServer()
	pb.RegisterServicesManagementServer(s, NewServicesManagementServer(db))

	log.Printf("🚀 Services Service gRPC running on %s", grpcPort)
	if err := s.Serve(listener); err != nil {
		log.Fatalf("gRPC Server error: %v", err)
	}
}
