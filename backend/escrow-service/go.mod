module github.com/intelli-reserve/backend/escrow-service

go 1.23

require (
	github.com/google/uuid v1.6.0
	github.com/intelli-reserve/backend/gen/go/escrow v0.0.0-00010101000000-000000000000
	github.com/jackc/pgx/v5 v5.5.5
	google.golang.org/grpc v1.62.1
)

require (
	github.com/golang/protobuf v1.5.4 // indirect
	github.com/intelli-reserve/backend/gen/go/common v0.0.0 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20221227161230-091c0ba34f0a // indirect
	golang.org/x/crypto v0.22.0 // indirect
	golang.org/x/net v0.24.0 // indirect
	golang.org/x/sync v0.7.0 // indirect
	golang.org/x/sys v0.19.0 // indirect
	golang.org/x/text v0.14.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20240325203815-454cdb8f5daa // indirect
	google.golang.org/protobuf v1.33.0 // indirect
)

replace (
	github.com/intelli-reserve/backend/gen/go/common => ../gen/go/common
	github.com/intelli-reserve/backend/gen/go/escrow => ../gen/go/escrow
)
