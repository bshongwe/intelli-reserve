package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"

	"github.com/intelli-reserve/backend/inventory-service/internal/db"
	"github.com/intelli-reserve/backend/inventory-service/internal/handlers"
	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/grpc"
)

func main() {
	// Database connection
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:postgres@localhost:5432/intelli_reserve?sslmode=disable"
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		log.Fatalf("Failed to create database pool: %v", err)
	}
	defer pool.Close()

	// Test connection
	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	log.Println("✓ Connected to PostgreSQL")

	// Initialize database schema
	if err := db.InitializeSchema(ctx, pool); err != nil {
		log.Fatalf("Failed to initialize schema: %v", err)
	}
	log.Println("✓ Database schema initialized")

	// Create gRPC server
	listener, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	server := grpc.NewServer()
	
	// Register services
	inventory := handlers.NewInventoryService(pool)
	handlers.RegisterInventoryServiceServer(server, inventory)

	log.Println("🚀 Inventory Service running on :50051")
	if err := server.Serve(listener); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}
