package main

import (
	"context"

	pb "github.com/intelli-reserve/backend/gen/go/escrow"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// ============================================================================
// PAYOUT OPERATIONS
// ============================================================================

// RequestPayout handles the RequestPayout gRPC call
// Phase 1: Validate and create payout record
func (ps *PayoutService) RequestPayout(ctx context.Context, req *pb.RequestPayoutRequest) (*pb.RequestPayoutResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, ErrRequestNil)
	}

	logger.Printf("RequestPayout called: hostID=%s, amount=%d", req.HostId, req.AmountCents)

	// Validate input parameters
	if req.HostId == "" {
		return nil, status.Error(codes.InvalidArgument, ErrHostIDMissing)
	}

	if req.AmountCents <= 0 {
		return nil, status.Error(codes.InvalidArgument, ErrInvalidAmount)
	}

	// Perform comprehensive validation
	escrowAccountID, err := ValidatePayoutRequestComplete(
		ctx,
		req.HostId,
		req.AmountCents,
	)

	if err != nil {
		logger.Printf("Validation failed: %v", err)
		return nil, status.Error(codes.FailedPrecondition, err.Error())
	}

	// Create payout record atomically
	payoutID, err := CreatePayout(
		ctx,
		req.HostId,
		escrowAccountID,
		req.AmountCents,
	)

	if err != nil {
		logger.Printf("Failed to create payout: %v", err)
		return nil, status.Error(codes.Internal, err.Error())
	}

	logger.Printf("✓ Payout request accepted: %s (amount: %d cents)", payoutID, req.AmountCents)

	// Fetch created payout to return
	payout, err := GetPayoutByID(ctx, payoutID)
	if err != nil {
		logger.Printf(ErrDatabaseError, err)
		return nil, status.Error(codes.Internal, err.Error())
	}

	// Convert to proto Payout
	protoPayout := &pb.Payout{
		Id:              payout.ID,
		HostId:          payout.HostID,
		Amount: &pb.Money{
			AmountCents: payout.AmountCents,
			Currency:    "ZAR",
		},
		PayoutStatus: payout.PayoutStatus,
		RequestedAt:  payout.RequestedAt.String(),
		CreatedAt:    payout.CreatedAt.String(),
	}

	if payout.ExternalTransactionID != nil {
		protoPayout.ExternalTransactionId = *payout.ExternalTransactionID
	}

	return &pb.RequestPayoutResponse{
		Success: true,
		Payout:  protoPayout,
	}, nil
}

// GetPayoutStatus handles the GetPayoutStatus gRPC call
func (ps *PayoutService) GetPayoutStatus(ctx context.Context, req *pb.GetPayoutStatusRequest) (*pb.GetPayoutStatusResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, ErrRequestNil)
	}

	if req.PayoutId == "" {
		return nil, status.Error(codes.InvalidArgument, ErrPayoutIDMissing)
	}

	logger.Printf("GetPayoutStatus called: payoutID=%s", req.PayoutId)

	// Fetch payout record
	payout, err := GetPayoutByID(ctx, req.PayoutId)
	if err != nil {
		if err.Error() == ErrPayoutNotFound {
			return nil, status.Error(codes.NotFound, ErrPayoutNotFound)
		}
		logger.Printf(ErrDatabaseError, err)
		return nil, status.Error(codes.Internal, err.Error())
	}

	// Build response
	response := &pb.GetPayoutStatusResponse{
		Success: true,
		Payout: &pb.Payout{
			Id:             payout.ID,
			HostId:         payout.HostID,
			Amount:         &pb.Money{AmountCents: payout.AmountCents, Currency: "ZAR"},
			PayoutStatus:   payout.PayoutStatus,
			RequestedAt:    payout.RequestedAt.String(),
			CreatedAt:      payout.CreatedAt.String(),
		},
	}

	// Add optional fields if present
	if payout.ExternalTransactionID != nil {
		response.Payout.ExternalTransactionId = *payout.ExternalTransactionID
	}

	if payout.FailureReason != nil {
		response.Payout.FailureReason = *payout.FailureReason
	}

	if payout.ProcessingStartedAt != nil {
		response.Payout.ProcessingStartedAt = payout.ProcessingStartedAt.String()
	}

	if payout.CompletedAt != nil {
		response.Payout.CompletedAt = payout.CompletedAt.String()
	}

	return response, nil
}

// GetPayoutHistory handles the GetPayoutHistory gRPC call
func (ps *PayoutService) GetPayoutHistory(ctx context.Context, req *pb.GetPayoutHistoryRequest) (*pb.GetPayoutHistoryResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, ErrRequestNil)
	}

	if req.HostId == "" {
		return nil, status.Error(codes.InvalidArgument, ErrHostIDMissing)
	}

	logger.Printf("GetPayoutHistory called: hostID=%s, limit=%d, offset=%d", req.HostId, req.Limit, req.Offset)

	// Validate pagination
	limit, offset, _ := ValidatePaginationParams(req.Limit, req.Offset)

	// Fetch payouts
	payouts, totalCount, err := GetPayoutsByHostID(ctx, req.HostId, limit, offset)
	if err != nil {
		logger.Printf(ErrDatabaseError, err)
		return nil, status.Error(codes.Internal, err.Error())
	}

	// Convert to protobuf messages
	pbPayouts := []*pb.Payout{}
	for _, p := range payouts {
		pbPayout := &pb.Payout{
			Id:           p.ID,
			HostId:       p.HostID,
			Amount:       &pb.Money{AmountCents: p.AmountCents, Currency: "ZAR"},
			PayoutStatus: p.PayoutStatus,
			RequestedAt:  p.RequestedAt.String(),
			CreatedAt:    p.CreatedAt.String(),
		}

		// Add optional fields
		if p.ExternalTransactionID != nil {
			pbPayout.ExternalTransactionId = *p.ExternalTransactionID
		}

		if p.FailureReason != nil {
			pbPayout.FailureReason = *p.FailureReason
		}

		if p.ProcessingStartedAt != nil {
			pbPayout.ProcessingStartedAt = p.ProcessingStartedAt.String()
		}

		if p.CompletedAt != nil {
			pbPayout.CompletedAt = p.CompletedAt.String()
		}

		pbPayouts = append(pbPayouts, pbPayout)
	}

	return &pb.GetPayoutHistoryResponse{
		Success:    true,
		Payouts:    pbPayouts,
		TotalCount: int32(totalCount),
	}, nil
}

// ============================================================================
// ACCOUNT OPERATIONS
// ============================================================================

// GetEscrowAccount handles the GetEscrowAccount gRPC call
func (ps *PayoutService) GetEscrowAccount(ctx context.Context, req *pb.GetEscrowAccountRequest) (*pb.GetEscrowAccountResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, ErrRequestNil)
	}

	if req.HostId == "" {
		return nil, status.Error(codes.InvalidArgument, ErrHostIDMissing)
	}

	logger.Printf("GetEscrowAccount called: hostID=%s", req.HostId)

	// Fetch account
	account, err := GetEscrowAccountByHostID(ctx, req.HostId)
	if err != nil {
		if err.Error() == ErrAccountNotFound {
			return nil, status.Error(codes.NotFound, ErrAccountNotFound)
		}
		logger.Printf(ErrDatabaseError, err)
		return nil, status.Error(codes.Internal, err.Error())
	}

	protoAccount := &pb.EscrowAccount{
		Id:               account.ID,
		HostId:           account.HostID,
		HeldBalance:      &pb.Money{AmountCents: account.HeldBalance, Currency: "ZAR"},
		AvailableBalance: &pb.Money{AmountCents: account.AvailableBalance, Currency: "ZAR"},
		TotalReceived:    &pb.Money{AmountCents: account.TotalReceived, Currency: "ZAR"},
		TotalPaidOut:     &pb.Money{AmountCents: account.TotalPaidOut, Currency: "ZAR"},
		AccountStatus:    account.AccountStatus,
		CreatedAt:        account.CreatedAt.String(),
		UpdatedAt:        account.UpdatedAt.String(),
	}

	return &pb.GetEscrowAccountResponse{
		Success: true,
		Account: protoAccount,
	}, nil
}

// GetAvailableBalance handles the GetAvailableBalance gRPC call
func (ps *PayoutService) GetAvailableBalance(ctx context.Context, req *pb.GetAvailableBalanceRequest) (*pb.GetAvailableBalanceResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, ErrRequestNil)
	}

	if req.HostId == "" {
		return nil, status.Error(codes.InvalidArgument, ErrHostIDMissing)
	}

	logger.Printf("GetAvailableBalance called: hostID=%s", req.HostId)

	// Fetch balance
	balance, err := GetAvailableBalance(ctx, req.HostId)
	if err != nil {
		if err.Error() == ErrAccountNotFound {
			return nil, status.Error(codes.NotFound, ErrAccountNotFound)
		}
		logger.Printf(ErrDatabaseError, err)
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &pb.GetAvailableBalanceResponse{
		Success:          true,
		AvailableBalance: &pb.Money{AmountCents: balance, Currency: "ZAR"},
	}, nil
}

// ============================================================================
// TRANSACTION HISTORY OPERATIONS
// ============================================================================

// GetTransactionHistory handles the GetTransactionHistory gRPC call
// Returns immutable audit log for compliance and debugging
func (ps *PayoutService) GetTransactionHistory(ctx context.Context, req *pb.GetTransactionHistoryRequest) (*pb.GetTransactionHistoryResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, ErrRequestNil)
	}

	if req.HostId == "" {
		return nil, status.Error(codes.InvalidArgument, ErrHostIDMissing)
	}

	logger.Printf("GetTransactionHistory called: hostID=%s, limit=%d, offset=%d", req.HostId, req.Limit, req.Offset)

	// Validate pagination
	limit, offset, _ := ValidatePaginationParams(req.Limit, req.Offset)

	// Fetch transaction history
	transactions, totalCount, err := GetTransactionHistoryByHostID(ctx, req.HostId, limit, offset)
	if err != nil {
		logger.Printf(ErrDatabaseError, err)
		return nil, status.Error(codes.Internal, err.Error())
	}

	// Convert to protobuf messages
	pbTransactions := []*pb.EscrowTransaction{}
	for _, t := range transactions {
		pbTx := &pb.EscrowTransaction{
			Id:              t.ID,
			TransactionType: t.TransactionType,
			Amount:          &pb.Money{AmountCents: t.AmountCents, Currency: "ZAR"},
			BalanceBefore:   &pb.Money{AmountCents: t.BalanceBefore, Currency: "ZAR"},
			BalanceAfter:    &pb.Money{AmountCents: t.BalanceAfter, Currency: "ZAR"},
			CreatedAt:       t.CreatedAt.String(),
		}

		// Add optional fields
		if t.PayoutID != nil {
			pbTx.PayoutId = *t.PayoutID
		}

		if t.HoldID != nil {
			pbTx.BookingId = *t.HoldID // Using BookingId field (closest available)
		}

		pbTransactions = append(pbTransactions, pbTx)
	}

	return &pb.GetTransactionHistoryResponse{
		Success:      true,
		Transactions: pbTransactions,
		TotalCount:   int32(totalCount),
	}, nil
}

// ============================================================================
// STUB IMPLEMENTATIONS (for escrow-specific methods not yet implemented)
// ============================================================================

// The following methods are defined in escrow-service but included here as stubs
// They handle escrow holds, disputes, and other escrow-specific operations

func (ps *PayoutService) CreateHold(ctx context.Context, req *pb.CreateHoldRequest) (*pb.CreateHoldResponse, error) {
	return nil, status.Error(codes.Unimplemented, ErrUnimplementedHoldOps)
}

func (ps *PayoutService) GetHold(ctx context.Context, req *pb.GetHoldRequest) (*pb.GetHoldResponse, error) {
	return nil, status.Error(codes.Unimplemented, ErrUnimplementedHoldOps)
}

func (ps *PayoutService) GetHoldsByBookingId(ctx context.Context, req *pb.GetHoldsByBookingIdRequest) (*pb.GetHoldsByBookingIdResponse, error) {
	return nil, status.Error(codes.Unimplemented, ErrUnimplementedHoldOps)
}

func (ps *PayoutService) GetHoldsByClientId(ctx context.Context, req *pb.GetHoldsByClientIdRequest) (*pb.GetHoldsByClientIdResponse, error) {
	return nil, status.Error(codes.Unimplemented, ErrUnimplementedHoldOps)
}

func (ps *PayoutService) GetHoldsByHostId(ctx context.Context, req *pb.GetHoldsByHostIdRequest) (*pb.GetHoldsByHostIdResponse, error) {
	return nil, status.Error(codes.Unimplemented, ErrUnimplementedHoldOps)
}

func (ps *PayoutService) GetAllHolds(ctx context.Context, req *pb.GetAllHoldsRequest) (*pb.GetAllHoldsResponse, error) {
	return nil, status.Error(codes.Unimplemented, ErrUnimplementedHoldOps)
}

func (ps *PayoutService) ReleaseHold(ctx context.Context, req *pb.ReleaseHoldRequest) (*pb.ReleaseHoldResponse, error) {
	return nil, status.Error(codes.Unimplemented, ErrUnimplementedHoldOps)
}

func (ps *PayoutService) RefundHold(ctx context.Context, req *pb.RefundHoldRequest) (*pb.RefundHoldResponse, error) {
	return nil, status.Error(codes.Unimplemented, ErrUnimplementedHoldOps)
}

func (ps *PayoutService) OpenDispute(ctx context.Context, req *pb.OpenDisputeRequest) (*pb.OpenDisputeResponse, error) {
	return nil, status.Error(codes.Unimplemented, ErrUnimplementedDisputeOps)
}

func (ps *PayoutService) GetDisputeStatus(ctx context.Context, req *pb.GetDisputeStatusRequest) (*pb.GetDisputeStatusResponse, error) {
	return nil, status.Error(codes.Unimplemented, ErrUnimplementedDisputeOps)
}
