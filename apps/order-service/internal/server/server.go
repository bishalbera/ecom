package server

import (
	"github.com/gofiber/fiber/v2"

	"order-service/internal/database"
)

type FiberServer struct {
	*fiber.App

	db database.Service
}

func New() *FiberServer {
	server := &FiberServer{
		App: fiber.New(fiber.Config{
			ServerHeader: "order-service",
			AppName:      "order-service",
		}),

		db: database.New(),
	}

	return server
}
