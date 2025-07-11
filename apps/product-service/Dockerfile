FROM golang:1.23-alpine AS builder

WORKDIR /app

COPY apps/product-service/go.mod apps/product-service/go.sum ./


RUN go mod download

COPY . .


WORKDIR /app/apps/product-service


RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o ./out/server -ldflags "-w -s" ./cmd/api


FROM alpine:latest AS production

RUN addgroup -S nonroot && adduser -S nonroot -G nonroot
USER nonroot

WORKDIR /app

COPY --from=builder /app/apps/product-service/out/server .

CMD ["./server"]


