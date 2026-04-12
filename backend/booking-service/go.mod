module github.com/intelli-reserve/backend/booking-service

go 1.23

require (
    google.golang.org/grpc v1.65.0
    google.golang.org/protobuf v1.34.2
    github.com/google/uuid v1.6.0
    github.com/jackc/pgx/v5 v5.6.0
    github.com/intelli-reserve/backend/gen/go v0.0.0
)

replace github.com/intelli-reserve/backend/gen/go => ../gen/go
