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
	ID         uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	BranchID   *uint          `gorm:"index" json:"branch_id,omitempty"`
	Name       string         `gorm:"type:varchar(255);not null" json:"name"`
	Category   string         `gorm:"type:varchar(100);not null" json:"category"`
	Price      int            `gorm:"type:integer;not null" json:"price"`
	CostPrice  int            `gorm:"type:integer;default:0" json:"cost_price"`
	Icon       string         `gorm:"type:varchar(100);not null" json:"icon"`
	SKU        string         `gorm:"type:varchar(100);uniqueIndex" json:"sku"`
	Stock      int            `gorm:"type:integer;default:0" json:"stock"`
	TrackStock bool           `gorm:"default:true" json:"track_stock"`
	Variations []ProductVariation `gorm:"serializer:json;type:jsonb;default:'[]'" json:"variations"`
	CreatedAt time.Time          `json:"created_at"`
	UpdatedAt time.Time          `json:"updated_at"`
	DeletedAt gorm.DeletedAt     `gorm:"index" json:"deleted_at,omitempty"`
}

type CreateProductRequest struct {
	BranchID   *uint              `json:"branch_id,omitempty"`
	Name       string             `json:"name"`
	SKU        string             `json:"sku"`
	Category   string             `json:"category"`
	Price      int                `json:"price"`
	CostPrice  int                `json:"cost_price"`
	Icon       string             `json:"icon"`
	Stock      int                `json:"stock"`
	TrackStock bool               `json:"track_stock"`
	Variations []ProductVariation `json:"variations"`
}

type UpdateProductRequest struct {
	Name       string             `json:"name"`
	SKU        string             `json:"sku"`
	Category   string             `json:"category"`
	Price      int                `json:"price"`
	CostPrice  int                `json:"cost_price"`
	Icon       string             `json:"icon"`
	Stock      int                `json:"stock"`
	TrackStock bool               `json:"track_stock"`
	Variations []ProductVariation `json:"variations"`
}
