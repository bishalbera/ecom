package service

import (
	"fmt"
	"order-service/internal/database"
	"order-service/internal/model"
	"order-service/internal/ports"

	"github.com/google/uuid"
)

type OrderService struct {
	db        database.Service
	productCl ports.ProductClient
	paymentCl ports.PaymentClient
}

func NewOrderSvc(db database.Service, productCl ports.ProductClient, paymentCl ports.PaymentClient) *OrderService {
	return &OrderService{
		db:        db,
		productCl: productCl,
	}
}

func (s *OrderService) UpdateOrderStatus(id string, status string) error {
	return s.db.UpdateOrderStatus(id, status)
}
func (s *OrderService) GetAllOrders(userId string) ([]*model.Order, error) {
	return s.db.GetAllOrders(userId)
}

func (s *OrderService) GetOrder(orderId string) (*model.Order, error) {
	return s.db.GetOrder(orderId)
}

func (s *OrderService) CreateOrder(userId string, items []model.OrderItems) (*model.Order, string, error) {
	order := &model.Order{
		Id:          uuid.New(),
		UserId:      userId,
		Items:       items,
		OrderStatus: "PENDING",
	}
	var total float64

	for i := range items {
		items[i].OrderId = order.Id
		price, err := s.productCl.GetPrice(items[i].ProductId)
		if err != nil {
			return nil, "", err
		}
		items[i].Price = price
		total += float64(items[i].Quantity) * price
	}

	order.Items = items
	order.Total = total

	// Save the order to the database first
	createdOrder, err := s.db.CreateOrder(order)
	if err != nil {
		return nil, "", err
	}

	// Call the payment service to create a payment intent
	clientSecret, err := s.paymentCl.CreatePaymentIntent(createdOrder.Id.String(), createdOrder.Total)
	if err != nil {
		return nil, "", fmt.Errorf("failed to create payment intent: %w", err)
	}

	return createdOrder, clientSecret, nil
}
