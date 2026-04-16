module github.com/intelli-reserve/backend/inventory-service

go 1.23

require (
	github.com/google/uuid v1.6.0
	github.com/intelli-reserve/backend/gen/go/inventory v0.0.0
	github.com/jackc/pgx/v5 v5.6.0
	google.golang.org/grpc v1.65.0
)

replace github.com/intelli-reserve/backend/gen/go/inventory => ../gen/go/inventory

require (
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20221227161230-091c0ba34f0a // indirect
	github.com/jackc/puddle/v2 v2.2.1 // indirect
	golang.org/x/crypto v0.23.0 // indirect
	golang.org/x/net v0.25.0 // indirect
	golang.org/x/sync v0.8.0 // indirect
	golang.org/x/sys v0.20.0 // indirect
	golang.org/x/text v0.15.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20240604185151-ef581f913117 // indirect
	google.golang.org/protobuf v1.34.2 // indirect
)
