package service

import (
	"order-service/internal/database"
	"order-service/internal/grpc"
	"order-service/internal/model"

	"github.com/google/uuid"
)

type OrderService struct {
	db        database.Service
	productCl *grpc.ProductClient
}

func NewOrderSvc(db database.Service, productCl *grpc.ProductClient) *OrderService {
	return &OrderService{
		db:        db,
		productCl: productCl,
	}
}

func (s *OrderService) GetOrder(orderId string) (*model.Order,error) {
	return s.db.GetOrder(orderId)
}

func (s *OrderService) CreateOrder(userId string, items []model.OrderItems) (*model.Order, error) {
	var total float64

	for i := range items {
		price, err := s.productCl.GetPrice(items[i].ProductId)
		if err != nil {
			return nil, err
		}
		items[i].Price = price
		total += float64(items[i].Quantity) * price
	}

	order := &model.Order{
		Id:          uuid.New(),
		UserId:      userId,
		Items:       items,
		Total:       total,
		OrderStatus: "PENDING",
	}
	return s.db.CreateOrder(order)
}
