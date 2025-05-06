package http_server 

import (
	"encoding/json"
	"fmt"
	"os"
	"product-service/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func (s *Server) RegisterFiberRoutes() {
	// Apply CORS middleware
	s.App.Use(cors.New(cors.Config{
		AllowOrigins:     "*",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS,PATCH",
		AllowHeaders:     "Accept,Authorization,Content-Type",
		AllowCredentials: false, // credentials require explicit origins
		MaxAge:           300,
	}))

	s.App.Get("/", s.HelloWorldHandler)

	s.App.Get("/health", s.healthHandler)
	s.App.Get("/products/:id", s.GetProductByIdHandler)
	s.App.Post("/products", s.UploadProductsHandler)

}

func (s *Server) HelloWorldHandler(c *fiber.Ctx) error {
	resp := fiber.Map{
		"message": "Hello World",
	}

	return c.JSON(resp)
}

func (s *Server) healthHandler(c *fiber.Ctx) error {
	return c.JSON(s.db.Health())
}

func (s *Server) GetProductByIdHandler(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID"})
	}
	product, err := s.db.GetById(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "product not found"})
	}
	return c.JSON(product)
}

func (s *Server) UploadProductsHandler(c *fiber.Ctx) error {
	filePath := "data/products.json"
	file, err := os.Open(filePath)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": fmt.Sprintf("failed to open seed file: %v", err),
		})
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	var products []models.Products

	if err := decoder.Decode(&products); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": fmt.Sprintf("failed to decode JSON: %v", err),
		})
	}

	const batchSize = 1000
	for i := 0; i < len(products); i += batchSize {
		end := i + batchSize
		if end > len(products) {
			end = len(products)
		}

		batch := products[i:end]
		if err := s.db.UploadMany(batch); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": fmt.Sprintf("failed to upload batch starting at %d: %v", i, err),
			})
		}
	}

	return c.JSON(fiber.Map{
		"message": fmt.Sprintf("Successfully uploaded %d products", len(products)),
	})

}
