package models

import "time"

type Customer struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string    `gorm:"type:varchar(255);not null" json:"name"`
	Phone       string    `gorm:"type:varchar(50)" json:"phone"`
	Email       string    `gorm:"type:varchar(255)" json:"email"`
	Address     string    `gorm:"type:text" json:"address"`
	CreditLimit int       `gorm:"type:integer;default:0" json:"credit_limit"`
	TotalSpent  int       `gorm:"type:integer;default:0" json:"total_spent"`
	Notes       string    `gorm:"type:text" json:"notes"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateCustomerRequest struct {
	Name        string `json:"name"`
	Phone       string `json:"phone"`
	Email       string `json:"email"`
	Address     string `json:"address"`
	CreditLimit int    `json:"credit_limit"`
	Notes       string `json:"notes"`
}

type UpdateCustomerRequest struct {
	Name        string `json:"name"`
	Phone       string `json:"phone"`
	Email       string `json:"email"`
	Address     string `json:"address"`
	CreditLimit int    `json:"credit_limit"`
	Notes       string `json:"notes"`
}

type StockAdjustRequest struct {
	ProductID uint   `json:"product_id"`
	Change    int    `json:"change"`
	Note      string `json:"note"`
}
