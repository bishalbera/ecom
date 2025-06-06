package main

import (
	"context"
	"fmt"
	"log"
	"order-service/internal/database"
	httpserver "order-service/internal/http_server"
	"order-service/internal/kafka"
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

func gracefulShutdown(fiberServer *httpserver.FiberServer, done chan bool) {
	// Create context that listens for the interrupt signal from the OS.
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// Listen for the interrupt signal.
	<-ctx.Done()

	log.Println("shutting down gracefully, press Ctrl+C again to force")
	stop() // Allow Ctrl+C to force shutdown

	// The context is used to inform the server it has 5 seconds to finish
	// the request it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := fiberServer.ShutdownWithContext(ctx); err != nil {
		log.Printf("Server forced to shutdown with error: %v", err)
	}

	log.Println("Server exiting")

	// Notify the main goroutine that the shutdown is complete
	done <- true
}

func main() {

	server := httpserver.New()

	server.RegisterFiberRoutes()
	db := database.New()

	conn, err := grpc.Dial("localhost:50053", grpc.WithInsecure()) // Adjust host/port as needed
	if err != nil {
		log.Fatalf("Could not connect to product service: %v", err)
	}
	defer conn.Close()
	productGrpcclient := productpb.NewProductServiceClient(conn)

	var productCl ports.ProductClient = client.NewProductClient(productGrpcclient)

	svc := service.NewOrderSvc(db, productCl)
	kafka.ConsumeOrderEvents(*svc)

	// Create a done channel to signal when the shutdown is complete
	done := make(chan bool, 1)

	go func() {
		port, _ := strconv.Atoi(os.Getenv("PORT"))
		err := server.Listen(fmt.Sprintf(":%d", port))
		if err != nil {
			panic(fmt.Sprintf("http server error: %s", err))
		}
	}()

	go func() {
		log.Println("Starting GRPC server on :50055")
		if err := client.NewGrpcServer(svc); err != nil {
			log.Fatalf("grpc server error %v", err)
		}
	}()

	// Run graceful shutdown in a separate goroutine
	go gracefulShutdown(server, done)

	// Wait for the graceful shutdown to complete
	<-done
	log.Println("Graceful shutdown complete.")
}
