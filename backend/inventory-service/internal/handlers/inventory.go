package handlers

import (
	"context"

	"github.com/google/uuid"
	"github.com/intelli-reserve/backend/inventory-service/internal/models"
	"github.com/intelli-reserve/backend/inventory-service/internal/repo"
	"github.com/jackc/pgx/v5/pgxpool"
)

// InventoryService implements the inventory service logic
type InventoryService struct {
	UnimplementedInventoryServiceServer
	serviceRepo  *repo.ServiceRepository
	slotRepo     *repo.TimeSlotRepository
}

// NewInventoryService creates a new inventory service
func NewInventoryService(pool *pgxpool.Pool) *InventoryService {
	return &InventoryService{
		serviceRepo:  repo.NewServiceRepository(pool),
		slotRepo:     repo.NewTimeSlotRepository(pool),
	}
}

// CreateServiceRequest is a placeholder for gRPC request
type CreateServiceRequest struct {
	HostID          string `json:"host_id"`
	Name            string `json:"name"`
	Description     string `json:"description"`
	Category        string `json:"category"`
	DurationMinutes int    `json:"duration_minutes"`
	BasePrice       int    `json:"base_price"`
	MaxParticipants int    `json:"max_participants"`
}

// ServiceResponse is a placeholder for gRPC response
type ServiceResponse struct {
	ID              string `json:"id"`
	HostID          string `json:"host_id"`
	Name            string `json:"name"`
	Description     string `json:"description"`
	Category        string `json:"category"`
	DurationMinutes int    `json:"duration_minutes"`
	BasePrice       int    `json:"base_price"`
	MaxParticipants int    `json:"max_participants"`
	IsActive        bool   `json:"is_active"`
}

// CreateService creates a new service
func (s *InventoryService) CreateService(ctx context.Context, req *CreateServiceRequest) (*ServiceResponse, error) {
	hostID, err := uuid.Parse(req.HostID)
	if err != nil {
		return nil, err
	}

	service := &models.Service{
		HostID:          hostID,
		Name:            req.Name,
		Description:     req.Description,
		Category:        req.Category,
		DurationMinutes: req.DurationMinutes,
		BasePrice:       req.BasePrice,
		MaxParticipants: req.MaxParticipants,
		IsActive:        true,
	}

	created, err := s.serviceRepo.CreateService(ctx, service)
	if err != nil {
		return nil, err
	}

	return &ServiceResponse{
		ID:              created.ID.String(),
		HostID:          created.HostID.String(),
		Name:            created.Name,
		Description:     created.Description,
		Category:        created.Category,
		DurationMinutes: created.DurationMinutes,
		BasePrice:       created.BasePrice,
		MaxParticipants: created.MaxParticipants,
		IsActive:        created.IsActive,
	}, nil
}

// GetService retrieves a service by ID
func (s *InventoryService) GetService(ctx context.Context, serviceID string) (*ServiceResponse, error) {
	id, err := uuid.Parse(serviceID)
	if err != nil {
		return nil, err
	}

	service, err := s.serviceRepo.GetService(ctx, id)
	if err != nil {
		return nil, err
	}

	if service == nil {
		return nil, nil
	}

	return &ServiceResponse{
		ID:              service.ID.String(),
		HostID:          service.HostID.String(),
		Name:            service.Name,
		Description:     service.Description,
		Category:        service.Category,
		DurationMinutes: service.DurationMinutes,
		BasePrice:       service.BasePrice,
		MaxParticipants: service.MaxParticipants,
		IsActive:        service.IsActive,
	}, nil
}

// GetServicesByHost retrieves all services for a host
func (s *InventoryService) GetServicesByHost(ctx context.Context, hostID string) ([]*ServiceResponse, error) {
	id, err := uuid.Parse(hostID)
	if err != nil {
		return nil, err
	}

	services, err := s.serviceRepo.GetServicesByHost(ctx, id)
	if err != nil {
		return nil, err
	}

	var responses []*ServiceResponse
	for _, svc := range services {
		responses = append(responses, &ServiceResponse{
			ID:              svc.ID.String(),
			HostID:          svc.HostID.String(),
			Name:            svc.Name,
			Description:     svc.Description,
			Category:        svc.Category,
			DurationMinutes: svc.DurationMinutes,
			BasePrice:       svc.BasePrice,
			MaxParticipants: svc.MaxParticipants,
			IsActive:        svc.IsActive,
		})
	}

	return responses, nil
}
