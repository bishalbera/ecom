package model

import (
	"github.com/google/uuid"
)

type Order struct {
	Id          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserId      string    `json:"user_id"`
	Items       []OrderItems
	OrderStatus string  `json:"order_status"`
	Total       float64 `json:"total"`
}

type OrderItems struct {
	Id        string   `gorm:"primary_key"`
	ProductId string `json:"product_id"`
	OrderId   uuid.UUID
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
}
