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

	"github.com/google/uuid"
	pb "github.com/intelli-reserve/backend/gen/go/booking"
	"github.com/jackc/pgx/v5"
	"google.golang.org/grpc"
)

type CreateBookingRequest struct {
	InventoryID string `json:"inventory_id"`
	SlotStart   string `json:"slot_start"`
	UserID      string `json:"user_id"`
	TenantID    string `json:"tenant_id"`
}

type CreateBookingResponse struct {
	BookingID string `json:"booking_id"`
	Status    string `json:"status"`
	Message   string `json:"message"`
}

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

	// Start HTTP REST API server (port 8080)
	go startHTTPServer()

	// Start gRPC server (port 8090)
	go startGRPCServer()

	// Wait for shutdown signal
	<-sigChan
	log.Printf("🛑 Shutdown signal received")
}

// startHTTPServer starts the REST API server on port 8080
func startHTTPServer() {
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/v1/bookings", createBookingHandler)

	port := ":8080"
	log.Printf("🚀 REST API server running on %s", port)

	if err := http.ListenAndServe(port, nil); err != nil && err != http.ErrServerClosed {
		log.Fatalf("HTTP Server error: %v", err)
	}
}

// startGRPCServer starts the gRPC server on port 8090
func startGRPCServer() {
	listener, err := net.Listen("tcp", ":8090")
	if err != nil {
		log.Fatalf("Failed to listen for gRPC: %v", err)
	}

	s := grpc.NewServer()
	bookingServer := NewBookingServiceServer(dbConn)
	pb.RegisterBookingServiceServer(s, bookingServer)

	log.Printf("🚀 gRPC server running on :8090")

	if err := s.Serve(listener); err != nil {
		log.Fatalf("gRPC Server error: %v", err)
	}
}


// HTTP Handlers (for backward compatibility)

func createBookingHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CreateBookingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.InventoryID == "" || req.UserID == "" || req.TenantID == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	bookingID := "booking_" + uuid.New().String()[:12]

	response := CreateBookingResponse{
		BookingID: bookingID,
		Status:    "INITIATED",
		Message:   "Booking created successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)

	log.Printf("✅ Booking created: %s", bookingID)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "healthy",
		"service": "booking-service",
		"grpc":    "available on :8090",
	})
}
