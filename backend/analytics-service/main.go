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
	httpPort = ":8081"
	grpcPort = ":8091"
)

func main() {
	connStr := "postgres://postgres:postgres@localhost:5432/intelli_reserve"
	conn, err := pgx.Connect(context.Background(), connStr)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer conn.Close(context.Background())
	log.Printf("✅ Analytics Service connected to PostgreSQL DB")

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
			"service": "analytics-service",
			"grpc":    "available on " + grpcPort,
		})
	})

	log.Printf("🚀 Analytics Service REST API server running on %s", httpPort)
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
	pb.RegisterAnalyticsServiceServer(s, NewAnalyticsServiceServer(db))

	log.Printf("🚀 Analytics Service gRPC server running on %s", grpcPort)
	if err := s.Serve(listener); err != nil {
		log.Fatalf("gRPC Server error: %v", err)
	}
}
