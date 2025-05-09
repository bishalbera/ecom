package server

import (
	"github.com/gofiber/fiber/v2"

	"google.golang.org/grpc"
	"order-service/internal/database"
	grpcclient "order-service/internal/grpc"
	"order-service/internal/service"
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
	db := database.New()
	productCl := grpcclient.NewProductClient(conn)
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
