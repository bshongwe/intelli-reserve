# Multi-stage build for identity-service

# Build stage
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copy go mod files from root
COPY go.work go.work.sum ./
COPY backend/gen ./backend/gen
COPY backend/identity-service ./backend/identity-service

WORKDIR /app/backend/identity-service

RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o identity-service .

# Runtime stage
FROM alpine:3.18

RUN apk add --no-cache ca-certificates

WORKDIR /root/

COPY --from=builder /app/backend/identity-service/identity-service .

EXPOSE 8085 8095

CMD ["./identity-service"]
