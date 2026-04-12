package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/google/uuid"
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

type server struct {
	// Backend server placeholder
}

func (s *server) CreateBooking(req *CreateBookingRequest) (*CreateBookingResponse, error) {
	log.Printf("Received booking request: %v", req)

	bookingID := "booking_" + uuid.New().String()[:12]

	return &CreateBookingResponse{
		BookingID: bookingID,
		Status:    "INITIATED",
		Message:   "Booking created successfully",
	}, nil
}

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
	})
}

func main() {
	// Start REST API server
	go func() {
		http.HandleFunc("/health", healthHandler)
		http.HandleFunc("/v1/bookings", createBookingHandler)

		port := ":8080"
		log.Printf("🚀 Booking Service running on %s", port)

		if err := http.ListenAndServe(port, nil); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Println("Shutting down booking service...")
}
