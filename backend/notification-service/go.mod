module github.com/intelli-reserve/backend/notification-service

go 1.23

require (
	github.com/google/uuid v1.5.0
	github.com/intelli-reserve/backend/gen/go/notification v0.0.0
	github.com/jackc/pgx/v5 v5.5.0
	google.golang.org/grpc v1.60.0
)

replace github.com/intelli-reserve/backend/gen/go/notification => ../gen/go/notification

replace github.com/intelli-reserve/backend/gen/go/common => ../gen/go/common

require (
	github.com/golang/protobuf v1.5.3 // indirect
	github.com/intelli-reserve/backend/gen/go/common v0.0.0 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20221227161230-091c0ba34f0a // indirect
	golang.org/x/crypto v0.17.0 // indirect
	golang.org/x/net v0.19.0 // indirect
	golang.org/x/sync v0.5.0 // indirect
	golang.org/x/sys v0.15.0 // indirect
	golang.org/x/text v0.14.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20231212172506-995d672761c0 // indirect
	google.golang.org/protobuf v1.31.0 // indirect
)
