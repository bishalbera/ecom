package main

import (
	"cart-service/internal/database"
	grpcserver "cart-service/internal/grpc_server"
	"cart-service/internal/http_server"
	"cart-service/internal/log"
	"context"
	"fmt"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"
	_ "github.com/joho/godotenv/autoload"
)

func gracefulShutdown(fiberServer *http_server.FiberServer, done chan bool) {
	// Create context that listens for the interrupt signal from the OS.
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// Listen for the interrupt signal.
	<-ctx.Done()

	log.Logger.Info("shutting down gracefully, press Ctrl+C again to force")
	stop() // Allow Ctrl+C to force shutdown

	// The context is used to inform the server it has 5 seconds to finish
	// the request it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := fiberServer.ShutdownWithContext(ctx); err != nil {
		log.Logger.Error("Server forced to shutdown with error", "error", err)
	}

	log.Logger.Info("Server exiting")

	// Notify the main goroutine that the shutdown is complete
	done <- true
}

func main() {

	log.New()

	db := database.New()
	server := http_server.New()

	server.RegisterFiberRoutes()

	// Create a done channel to signal when the shutdown is complete
	done := make(chan bool, 1)

	go func() {
		port, _ := strconv.Atoi(os.Getenv("PORT"))
		err := server.Listen(fmt.Sprintf(":%d", port))
		if err != nil {
			log.Logger.Error("http server error", "error", err)
		}
	}()

	go func() {
		log.Logger.Info("Starting GRPC server on :50054")
		if err := grpcserver.NewGrpcServer(db); err != nil {
			log.Logger.Error("grpc server error", "error", err)
		}
	}()

	// Run graceful shutdown in a separate goroutine
	go gracefulShutdown(server, done)

	// Wait for the graceful shutdown to complete
	<-done
	log.Logger.Info("Graceful shutdown complete.")
}
