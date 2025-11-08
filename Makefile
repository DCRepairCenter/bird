# Makefile for the Bird Game

.PHONY: run build clean

# Run the Go server
run:
	@echo "Starting server on http://localhost:8080"
	@go run main.go

# Build the Go application
build:
	@echo "Building binary..."
	@go build -o bird-server main.go

# Clean the build artifacts
clean:
	@echo "Cleaning up..."
	@rm -f bird-server