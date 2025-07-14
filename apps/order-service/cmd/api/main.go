package main

import (
	"context"
	"fmt"
	"log/slog"
	"order-service/internal/database"
	httpserver "order-service/internal/http_server"
	"order-service/internal/kafka"
	"order-service/internal/log"
	"order-service/internal/ports"
	"order-service/internal/service"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"
	
	productpb "order-service/github.com/ecom/packages/proto/product"
	client "order-service/internal/grpc"

	_ "github.com/joho/godotenv/autoload"
	"google.golang.org/grpc"
)

func gracefulShutdown(logger *slog.Logger, fiberServer *httpserver.FiberServer, done chan bool) {
	// Create context that listens for the interrupt signal from the OS.
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// Listen for the interrupt signal.
	<-ctx.Done()

	logger.Info("shutting down gracefully, press Ctrl+C again to force")
	stop() // Allow Ctrl+C to force shutdown

	// The context is used to inform the server it has 5 seconds to finish
	// the request it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := fiberServer.ShutdownWithContext(ctx); err != nil {
		logger.Error("server forced to shutdown", "error", err)
	}

	logger.Info("server exiting")

	// Notify the main goroutine that the shutdown is complete
	done <- true
}

func main() {
	logger := log.New()

	db := database.New(logger)
	server := httpserver.New(db, logger)

	productConn, err := grpc.Dial("localhost:50053", grpc.WithInsecure()) // Adjust host/port as needed
	if err != nil {
		logger.Error("could not connect to product service", "error", err)
		os.Exit(1)
	}
	defer productConn.Close()
	productGrpcclient := productpb.NewProductServiceClient(productConn)

	var productCl ports.ProductClient = client.NewProductClient(productGrpcclient, logger)

	paymentConn, err := grpc.Dial("localhost:50056", grpc.WithInsecure()) // Adjust host/port as needed
	if err != nil {
		logger.Error("could not connect to payment service", "error", err)
		os.Exit(1)
	}
	defer paymentConn.Close()

	var paymentCl ports.PaymentClient = client.NewPaymentClient(paymentConn, logger)

	svc := service.NewOrderSvc(db, productCl, paymentCl, logger)
	kafka.ConsumeOrderEvents(*svc, logger)

	// Create a done channel to signal when the shutdown is complete
	done := make(chan bool, 1)

	go func() {
		port, _ := strconv.Atoi(os.Getenv("PORT"))
		addr := fmt.Sprintf(":%d", port)
		logger.Info("starting http server", "address", addr)
		err := server.Listen(addr)
		if err != nil {
			logger.Error("http server error", "error", err)
			os.Exit(1)
		}
	}()

	go func() {
		addr := ":50055"
		logger.Info("starting grpc server", "address", addr)
		if err := client.NewGrpcServer(svc, logger); err != nil {
			logger.Error("grpc server error", "error", err)
			os.Exit(1)
		}
	}()

	// Run graceful shutdown in a separate goroutine
	go gracefulShutdown(logger, server, done)

	// Wait for the graceful shutdown to complete
	<-done
	logger.Info("graceful shutdown complete")
}
