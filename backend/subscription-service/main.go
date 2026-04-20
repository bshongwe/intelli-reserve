package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/grpc"

	subscription "github.com/intelli-reserve/backend/gen/go/subscription"
)

var (
	port = ":50009"
	db   *pgxpool.Pool
)

type SubscriptionServer struct {
	subscription.UnimplementedSubscriptionServiceServer
	db *pgxpool.Pool
}

func init() {
	if envPort := os.Getenv("SUBSCRIPTION_PORT"); envPort != "" {
		port = ":" + envPort
	}
}

func main() {
	// Initialize database connection
	var err error
	db, err = initDB()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Start gRPC server
	listener, err := net.Listen("tcp", port)
	if err != nil {
		log.Fatalf("Failed to listen on port %s: %v", port, err)
	}

	grpcServer := grpc.NewServer()
	subscription.RegisterSubscriptionServiceServer(
		grpcServer,
		&SubscriptionServer{db: db},
	)

	log.Printf("Subscription service listening on %s", port)
	if err := grpcServer.Serve(listener); err != nil {
		log.Fatalf("Failed to start gRPC server: %v", err)
	}
}

func initDB() (*pgxpool.Pool, error) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Default connection string for local development
		dbURL = "postgres://postgres:postgres@localhost:5432/intelli_reserve"
	}

	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		return nil, fmt.Errorf("unable to parse database URL: %w", err)
	}

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("unable to create database pool: %w", err)
	}

	// Test connection
	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}

	return pool, nil
}
