package models

import (
	"time"

	"gorm.io/gorm"
)

type ProductVariation struct {
	Name  string `json:"name"`
	Price int    `json:"price"`
}


type Product struct {
	ID        uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string         `gorm:"type:varchar(255);not null" json:"name"`
	Category  string         `gorm:"type:varchar(100);not null" json:"category"`
	Price     int            `gorm:"type:integer;not null" json:"price"`
	Icon      string             `gorm:"type:varchar(100);not null" json:"icon"`
	SKU       string             `gorm:"type:varchar(100);uniqueIndex" json:"sku"`
	Stock     int                `gorm:"type:integer;default:100" json:"stock"`
	Variations []ProductVariation `gorm:"serializer:json;type:jsonb;default:'[]'" json:"variations"`
	CreatedAt time.Time          `json:"created_at"`
	UpdatedAt time.Time          `json:"updated_at"`
	DeletedAt gorm.DeletedAt     `gorm:"index" json:"deleted_at,omitempty"`
}

type CreateProductRequest struct {
	Name     string `json:"name"`
	Category   string             `json:"category"`
	Price      int                `json:"price"`
	Icon       string             `json:"icon"`
	Stock      int                `json:"stock"`
	Variations []ProductVariation `json:"variations"`
}

type UpdateProductRequest struct {
	Name     string `json:"name"`
	Category   string             `json:"category"`
	Price      int                `json:"price"`
	Icon       string             `json:"icon"`
	Stock      int                `json:"stock"`
	Variations []ProductVariation `json:"variations"`
}
