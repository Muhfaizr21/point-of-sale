package models

import (
	"time"
)

type Order struct {
	ID            uint        `gorm:"primaryKey;autoIncrement" json:"id"`
	InvoiceNumber string      `gorm:"type:varchar(100);uniqueIndex;not null" json:"invoice_number"`
	Subtotal      int         `gorm:"type:integer;not null" json:"subtotal"`
	Tax           int         `gorm:"type:integer;not null" json:"tax"`
	Total         int         `gorm:"type:integer;not null" json:"total"`
	PaymentMethod string      `gorm:"type:varchar(50);not null" json:"payment_method"`
	CreatedAt     time.Time   `json:"created_at"`
	OrderItems    []OrderItem `gorm:"foreignKey:OrderID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"items"`
}

type OrderItem struct {
	ID          uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderID     uint   `gorm:"not null" json:"order_id"`
	ProductID   uint   `gorm:"not null" json:"product_id"`
	ProductName string `gorm:"type:varchar(255);not null" json:"product_name"`
	Price       int    `gorm:"type:integer;not null" json:"price"`
	Quantity    int    `gorm:"type:integer;not null" json:"quantity"`
}

type CreateOrderItemRequest struct {
	ProductID uint `json:"product_id"`
	Quantity  int  `json:"quantity"`
}

type CreateOrderRequest struct {
	PaymentMethod string                   `json:"payment_method"`
	Items         []CreateOrderItemRequest `json:"items"`
}
