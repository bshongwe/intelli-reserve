package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/google/uuid"
	"google.golang.org/grpc"
	pb "github.com/intelli-reserve/backend/internal/proto" // adjust path after creating proto
)

type server struct {
	pb.UnimplementedBookingServiceServer
}

func (s *server) CreateBooking(ctx context.Context, req *pb.CreateBookingRequest) (*pb.CreateBookingResponse, error) {
	log.Printf("Received booking request: %v", req)

	// TODO: Start Saga here
	bookingID := "bk_" + uuid.New().String()[:8]

	return &pb.CreateBookingResponse{
		BookingId: bookingID,
		Status:    "INITIATED",
		Message:   "Saga started successfully",
	}, nil
}

func main() {
	lis, err := net.Listen("tcp", ":8080")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	s := grpc.NewServer()
	pb.RegisterBookingServiceServer(s, &server{})

	log.Println("🚀 Booking Service running on :8080")

	// Graceful shutdown
	go func() {
		sig := make(chan os.Signal, 1)
		signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
		<-sig
		log.Println("Shutting down gRPC server...")
		s.GracefulStop()
	}()

	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
