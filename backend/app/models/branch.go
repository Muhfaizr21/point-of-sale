package models

import "time"

type Branch struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	MerchantID *uint    `gorm:"index" json:"merchant_id,omitempty"`
	Name      string    `gorm:"type:varchar(255);not null" json:"name"`
	Code      string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"code"`
	Address   string    `gorm:"type:text" json:"address"`
	Phone     string    `gorm:"type:varchar(50)" json:"phone"`
	City      string    `gorm:"type:varchar(100)" json:"city"`
	Latitude  float64   `gorm:"default:0" json:"latitude"`
	Longitude float64   `gorm:"default:0" json:"longitude"`
	Active    bool      `gorm:"default:true" json:"active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Merchant  *Merchant `gorm:"foreignKey:MerchantID" json:"merchant,omitempty"`
}

type CreateBranchRequest struct {
	Name    string `json:"name"`
	Code    string `json:"code"`
	Address string `json:"address,omitempty"`
	Phone   string `json:"phone,omitempty"`
	City    string `json:"city,omitempty"`
}

type UpdateBranchRequest struct {
	Name    string `json:"name,omitempty"`
	Code    string `json:"code,omitempty"`
	Address string `json:"address,omitempty"`
	Phone   string `json:"phone,omitempty"`
	City    string `json:"city,omitempty"`
	Active  *bool  `json:"active,omitempty"`
}
