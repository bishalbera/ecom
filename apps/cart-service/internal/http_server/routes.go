package http_server

import (
	"cart-service/internal/model"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func (s *FiberServer) RegisterFiberRoutes() {
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

	s.App.Get("/cart/:userId", s.GetCartHandler)
	s.App.Post("/cart/:userId", s.AddItemHandler)
	s.App.Delete("/cart/:userId", s.ClearCartHandler)
}

func (s *FiberServer) GetCartHandler(c *fiber.Ctx) error {
	userId := c.Params("userId")
	cart, err := s.db.GetCart(userId)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(cart)
}

func (s *FiberServer) AddItemHandler(c *fiber.Ctx) error {
	userId := c.Params("userId")
	var item model.CartItems
	if err := c.BodyParser(&item); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	err := s.db.AddItem(userId, item.ProductId, int32(item.Quantity))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"status": "item added"})
}

func (s *FiberServer) ClearCartHandler(c *fiber.Ctx) error {
	userId := c.Params("userId")
	err := s.db.ClearCart(userId)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"status": "cart cleared"})
}

func (s *FiberServer) HelloWorldHandler(c *fiber.Ctx) error {
	resp := fiber.Map{
		"message": "Hello World",
	}

	return c.JSON(resp)
}

func (s *FiberServer) healthHandler(c *fiber.Ctx) error {
	return c.JSON(s.db.Health())
}
