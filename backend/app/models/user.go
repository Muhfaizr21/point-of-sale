package models

import "time"

type User struct {
	ID             uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	MerchantID     *uint      `gorm:"uniqueIndex:idx_user_merchant" json:"merchant_id,omitempty"`
	Username       string     `gorm:"type:varchar(50);uniqueIndex:idx_user_merchant;not null" json:"username"`
	Password       string     `gorm:"type:varchar(255);not null" json:"-"`
	Role           string     `gorm:"type:varchar(20);default:'cashier'" json:"role"`
	Name           string     `gorm:"type:varchar(100)" json:"name"`
	BranchID       *uint      `json:"branch_id,omitempty"`
	Token          string     `gorm:"type:varchar(255)" json:"-"`
	TokenExpiresAt *time.Time `gorm:"type:timestamp" json:"-"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	Branch         *Branch    `gorm:"foreignKey:BranchID" json:"branch,omitempty"`
	Merchant       *Merchant  `gorm:"foreignKey:MerchantID" json:"merchant,omitempty"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token    string `json:"token"`
	User     User   `json:"user"`
}

type StockLog struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	ProductID uint      `gorm:"not null;index" json:"product_id"`
	Product   Product   `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	Change    int       `gorm:"not null" json:"change"`
	Remaining int       `gorm:"not null" json:"remaining"`
	Note      string    `gorm:"type:varchar(255)" json:"note"`
	CreatedAt time.Time `json:"created_at"`
}
