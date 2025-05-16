package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Products struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Price       float64   `json:"price"`
	Stock       int       `json:"stock"`
	Rating      float64   `json:"rating"`
	Category    string    `json:"category"`
}

// Hook to generate UUID before create
func (p *Products) BeforeCreate(tx *gorm.DB) (err error) {
	p.ID = uuid.New()
	return
}
