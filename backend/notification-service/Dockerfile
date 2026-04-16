# Multi-stage build for notification-service

# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy go mod files from root
COPY go.work go.work.sum ./
COPY backend/gen ./backend/gen
COPY backend/notification-service ./backend/notification-service

WORKDIR /app/backend/notification-service

RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o notification-service .

# Runtime stage
FROM alpine:3.18

RUN apk add --no-cache ca-certificates

WORKDIR /root/

COPY --from=builder /app/backend/notification-service/notification-service .

EXPOSE 8084 8094

CMD ["./notification-service"]
