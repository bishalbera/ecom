package http_server

import (
	"github.com/gofiber/fiber/v2"

	"cart-service/internal/database"
)

type FiberServer struct {
	*fiber.App

	db database.Service
}

func New() *FiberServer {
	server := &FiberServer{
		App: fiber.New(fiber.Config{
			ServerHeader: "cart-service",
			AppName:      "cart-service",
		}),

		db: database.New(),
	}

	return server
}
