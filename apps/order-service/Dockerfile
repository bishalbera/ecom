# Stage 1: Build the Go binary
FROM golang:1.23-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the Go module files first to leverage Docker layer caching
COPY go.mod go.sum ./

# Download Go module dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the Go binary
# -o ./out/server: Specifies the output directory and filename for the binary.
# -ldflags "-w -s": Strips debug information to reduce the binary size.
# CGO_ENABLED=0: Disables CGO to create a static binary.
# GOOS=linux GOARCH=amd64: Ensures the binary is built for a Linux environment.
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o ./out/server -ldflags "-w -s" ./cmd/api

# Stage 2: Create the final, minimal production image
FROM alpine:latest

# Create a non-root user for security
RUN addgroup -S nonroot && adduser -S nonroot -G nonroot
USER nonroot

# Set the working directory
WORKDIR /app

# Copy the compiled binary from the builder stage
COPY --from=builder /app/out/server .

# The Go app in this project listens on port 8080 by default.
EXPOSE 8080

# Run the binary
CMD ["./server"]
