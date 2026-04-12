#!/bin/bash

# Generate Go code from proto files

set -e

PROTO_DIR="backend/proto"
GEN_DIR="backend/gen/go"
GOBIN=$(go env GOPATH)/bin

echo "🔧 Generating Go code from proto files..."

# Create gen directory if it doesn't exist
mkdir -p "$GEN_DIR"

# Install protoc plugins if needed
echo "📦 Installing protoc plugins..."
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Clean previous generated files
rm -rf "$GEN_DIR"/*
mkdir -p "$GEN_DIR"

# Generate code for each proto file
echo "🔨 Generating code..."

protoc \
  --proto_path="$PROTO_DIR" \
  --plugin=protoc-gen-go="$GOBIN/protoc-gen-go" \
  --plugin=protoc-gen-go-grpc="$GOBIN/protoc-gen-go-grpc" \
  --go_out="$GEN_DIR" \
  --go-grpc_out="$GEN_DIR" \
  --go_opt=module=github.com/intelli-reserve/backend/gen/go \
  --go-grpc_opt=module=github.com/intelli-reserve/backend/gen/go \
  "$PROTO_DIR"/*.proto

echo "✅ Go code generation complete!"
echo "📁 Generated files in: $GEN_DIR"
echo ""
echo "Generated structure:"
ls -la "$GEN_DIR"
