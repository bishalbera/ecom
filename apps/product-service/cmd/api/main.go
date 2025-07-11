package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"product-service/internal/database"
	"product-service/internal/grpc_server"
	"product-service/internal/http_server"
	"product-service/internal/log"
	"strconv"
	"syscall"
	"time"

	_ "github.com/joho/godotenv/autoload"
)

func gracefulShutdown(server *http_server.Server, done chan bool) {
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
	if err := server.ShutdownWithContext(ctx); err != nil {
		log.Logger.Error("Server forced to shutdown with error: %v", "error", err)
	}

	log.Logger.Info("Server exiting")

	// Notify the main goroutine that the shutdown is complete
	done <- true
}

func main() {

	log.New() // Initialize logger
	db := database.New()
	server := http_server.New()

	server.RegisterFiberRoutes()
	// Create a done channel to signal when the shutdown is complete
	done := make(chan bool, 1)

	go func() {
		port, _ := strconv.Atoi(os.Getenv("PORT"))
		err := server.Listen(fmt.Sprintf(":%d", port))
		if err != nil {
			panic(fmt.Sprintf("http server error: %s", err))
		}
	}()

	// Create and start grpc server
	go func() {

		log.Logger.Info("Starting grpc server on port 50053...")
		if err := grpc_server.NewGrpcServer(db); err != nil {
			log.Logger.Error("grpc server error: %v", "error", err)
		}
	}()
	// Run graceful shutdown in a separate goroutine
	go gracefulShutdown(server, done)

	// Wait for the graceful shutdown to complete
	<-done
	log.Logger.Info("Graceful shutdown complete.")
}
