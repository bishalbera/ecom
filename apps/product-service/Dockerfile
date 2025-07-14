FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copy go mod files (now relative to service context)
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o ./out/server -ldflags "-w -s" ./cmd/api

# Production stage
FROM alpine:latest AS production

RUN addgroup -S nonroot && adduser -S nonroot -G nonroot
USER nonroot

WORKDIR /app

COPY --from=builder /app/out/server .


CMD ["./server"]


