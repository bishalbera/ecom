package httpserver

import (
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
}

func New() *FiberServer {
	conn, err := grpc.Dial("localhost:50053", grpc.WithInsecure())
	if err != nil {
		panic(err)
	}
	productGrpcClient := pb.NewProductServiceClient(conn)
	var productCl ports.ProductClient = grpcclient.NewProductClient(productGrpcClient)
	db := database.New()

	orderSvc := service.NewOrderSvc(db, productCl)
	server := &FiberServer{
		App: fiber.New(fiber.Config{
			ServerHeader: "order-service",
			AppName:      "order-service",
		}),

		Service: orderSvc,
		db:      db,
	}

	return server
}
