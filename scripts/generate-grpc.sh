#!/bin/bash

# Generate Go code from proto files

set -e

PROTO_DIR="backend/proto"
GEN_DIR="backend/gen/go"

echo "🔧 Generating Go code from proto files..."

# Create gen directory if it doesn't exist
mkdir -p "$GEN_DIR"

# Install protoc plugins if needed
echo "📦 Installing protoc plugins..."
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Generate code for each proto file
echo "🔨 Generating code..."

protoc \
  --proto_path="$PROTO_DIR" \
  --go_out="$GEN_DIR" \
  --go-grpc_out="$GEN_DIR" \
  --go_opt=module=github.com/intelli-reserve/backend \
  --go-grpc_opt=module=github.com/intelli-reserve/backend \
  "$PROTO_DIR"/*.proto

echo "✅ Go code generation complete!"
echo "📁 Generated files in: $GEN_DIR"
echo ""
echo "Generated structure:"
ls -la "$GEN_DIR"
