package httpserver

import (
	"log/slog"

	"github.com/gofiber/fiber/v2"

	"order-service/internal/database"
	grpcclient "order-service/internal/grpc"
	"order-service/internal/ports"
	"order-service/internal/service"

	"google.golang.org/grpc"

	pb "order-service/github.com/ecom/packages/proto/product"
)

type FiberServer struct {
	*fiber.App
	db      database.Service
	Service *service.OrderService
	logger  *slog.Logger
}

func New(db database.Service, logger *slog.Logger) *FiberServer {
	productConn, err := grpc.Dial("localhost:50053", grpc.WithInsecure())
	if err != nil {
		logger.Error("failed to connect to product service", "error", err)
		panic(err)
	}
	productGrpcClient := pb.NewProductServiceClient(productConn)
	var productCl ports.ProductClient = grpcclient.NewProductClient(productGrpcClient, logger)

	paymentConn, err := grpc.Dial("localhost:50054", grpc.WithInsecure())
	if err != nil {
		logger.Error("failed to connect to payment service", "error", err)
		panic(err)
	}
	var paymentCl ports.PaymentClient = grpcclient.NewPaymentClient(paymentConn, logger)

	orderSvc := service.NewOrderSvc(db, productCl, paymentCl, logger)
	server := &FiberServer{
		App: fiber.New(fiber.Config{
			ServerHeader: "order-service",
			AppName:      "order-service",
		}),

		Service: orderSvc,
		db:      db,
		logger:  logger,
	}

	return server
}
