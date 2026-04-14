FROM golang:1.23-alpine AS builder
WORKDIR /app/backend/inventory-service
COPY backend/inventory-service/ ./
COPY backend/gen/go ../gen/go

RUN go build -o inventory-service .

FROM alpine:3.19
RUN apk add --no-cache ca-certificates curl
COPY --from=builder /app/backend/inventory-service/inventory-service /usr/local/bin/

EXPOSE 8082 8092
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8082/health || exit 1

CMD ["inventory-service"]
