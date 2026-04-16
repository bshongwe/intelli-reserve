module github.com/intelli-reserve/backend/gen/go/notification

go 1.23

require (
	github.com/intelli-reserve/backend/gen/go/common v0.0.0
	google.golang.org/grpc v1.60.0
	google.golang.org/protobuf v1.31.0
)

replace github.com/intelli-reserve/backend/gen/go/common => ../common

require (
	github.com/golang/protobuf v1.5.3 // indirect
	golang.org/x/net v0.19.0 // indirect
	golang.org/x/sys v0.15.0 // indirect
	golang.org/x/text v0.14.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20231212172506-995d672761c0 // indirect
)
