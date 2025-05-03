package server

import (
	"github.com/gofiber/fiber/v2"

	"product-service/internal/database"
)

type Server struct {
	*fiber.App

	db database.Service
}

func New() *Server {
	server := &Server{
		App: fiber.New(fiber.Config{
			ServerHeader: "product-service",
			AppName:      "product-service",
		}),

		db: database.New(),
	}

	return server
}
