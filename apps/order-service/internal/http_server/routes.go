package httpserver

import (
	"order-service/internal/model"

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
	s.App.Get("/order/:id", s.GetOrderHandler)
	s.App.Get("/orders", s.GetAllOrdersHandler)
	s.App.Post("/order", s.CreateOrderHandler)

}

type CreateOrderRequest struct {
	Items []model.OrderItems `json:"items"`
}

func (s *FiberServer) GetAllOrdersHandler(c *fiber.Ctx) error {
	userId := c.Query("userId")
	if userId == "" {
		s.logger.Error("userId cannot be empty")
		return c.Status(400).JSON(fiber.Map{"error": "userId cannot be empty"})
	}
	orders, err := s.Service.GetAllOrders(userId)
	if err != nil {
		s.logger.Error("failed to get all orders", "error", err)
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})

	}
	return c.JSON(orders)
}
func (s *FiberServer) GetOrderHandler(c *fiber.Ctx) error {

	id := c.Params("id")
	if id == "" {
		s.logger.Error("invalid id")
		return c.Status(400).JSON(fiber.Map{"error": "invalid id"})

	}
	order, err := s.Service.GetOrder(id)
	if err != nil {
		s.logger.Error("order not found", "error", err)
		return c.Status(404).JSON(fiber.Map{"error": "order not found"})
	}
	return c.JSON(order)
}

func (s *FiberServer) CreateOrderHandler(c *fiber.Ctx) error {
	var req CreateOrderRequest
	if err := c.BodyParser(&req); err != nil {
		s.logger.Error("invalid input", "error", err)
		return c.Status(400).JSON(fiber.Map{"error": "invalid input"})
	}
	userId := c.Query("userId")
	if userId == "" {
		s.logger.Error("userId cannot be empty")
		return c.Status(400).JSON(fiber.StatusBadRequest)
	}
	order, clientSecret, err := s.Service.CreateOrder(userId, req.Items)
	if err != nil {
		s.logger.Error("failed to create order", "error", err)
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"order": order, "clientSecret": clientSecret})
}

func (s *FiberServer) HelloWorldHandler(c *fiber.Ctx) error {
	resp := fiber.Map{
		"message": "Hello World",
	}
	s.logger.Info("Hello World handler called")

	return c.JSON(resp)
}

func (s *FiberServer) healthHandler(c *fiber.Ctx) error {
	health := s.db.Health()
	s.logger.Info("health check", "health", health)
	return c.JSON(health)
}
