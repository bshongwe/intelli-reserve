FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copy go.mod and go.sum
COPY backend/escrow-service/go.mod backend/escrow-service/go.sum ./
COPY backend/gen/go/escrow ../gen/go/escrow

# Download dependencies
RUN go mod download

# Copy source code
COPY backend/escrow-service/*.go ./

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o escrow-service .

# Final stage
FROM alpine:3.19

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/escrow-service .

EXPOSE 8086 8096

CMD ["./escrow-service"]
