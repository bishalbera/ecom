package service

import (
	"order-service/internal/database"
	"order-service/internal/model"
	"order-service/internal/ports"

	"github.com/google/uuid"
)

type OrderService struct {
	db        database.Service
	productCl ports.ProductClient
}

func NewOrderSvc(db database.Service, productCl ports.ProductClient) *OrderService {
	return &OrderService{
		db:        db,
		productCl: productCl,
	}
}

func (s *OrderService) GetAllOrders() ([]*model.Order, error) {
	return s.db.GetAllOrders()
}

func (s *OrderService) GetOrder(orderId string) (*model.Order, error) {
	return s.db.GetOrder(orderId)
}

func (s *OrderService) CreateOrder(userId string, items []model.OrderItems) (*model.Order, error) {
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
			return nil, err
		}
		items[i].Price = price
		total += float64(items[i].Quantity) * price
	}

	order.Items = items
	order.Total = total

	
	return s.db.CreateOrder(order)
}
