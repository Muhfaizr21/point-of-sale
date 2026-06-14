package models

import "time"

type Promo struct {
	ID              uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	MerchantID      *uint  `gorm:"index" json:"merchant_id,omitempty"`
	BranchID        *uint  `gorm:"index" json:"branch_id,omitempty"`
	Name            string `gorm:"type:varchar(255);not null" json:"name"`
	Type            string `gorm:"type:varchar(50);not null" json:"type"`
	Value           int    `gorm:"type:integer;not null" json:"value"`
	MinAmount       int    `gorm:"type:integer;default:0" json:"min_amount"`
	BuyQty          int    `gorm:"type:integer;default:0" json:"buy_qty"`
	FreeQty         int    `gorm:"type:integer;default:0" json:"free_qty"`
	FreeProductID   *uint  `json:"free_product_id,omitempty"`
	TimeStart       string `gorm:"type:varchar(5)" json:"time_start"`
	TimeEnd         string `gorm:"type:varchar(5)" json:"time_end"`
	DayOfWeek       string `gorm:"type:varchar(50)" json:"day_of_week"`
	ProductIDs      []uint `gorm:"serializer:json;type:jsonb;default:'[]'" json:"product_ids"`
	Active          bool   `gorm:"default:true" json:"active"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type CreatePromoRequest struct {
	MerchantID     *uint  `json:"merchant_id,omitempty"`
	BranchID      *uint  `json:"branch_id,omitempty"`
	Name          string `json:"name"`
	Type          string `json:"type"`
	Value         int    `json:"value"`
	MinAmount     int    `json:"min_amount"`
	BuyQty        int    `json:"buy_qty"`
	FreeQty       int    `json:"free_qty"`
	FreeProductID *uint  `json:"free_product_id"`
	TimeStart     string `json:"time_start"`
	TimeEnd       string `json:"time_end"`
	DayOfWeek     string `json:"day_of_week"`
	ProductIDs    []uint `json:"product_ids"`
	Active        bool   `json:"active"`
}

type UpdatePromoRequest struct {
	Name          string `json:"name"`
	Type          string `json:"type"`
	Value         int    `json:"value"`
	MinAmount     int    `json:"min_amount"`
	BuyQty        int    `json:"buy_qty"`
	FreeQty       int    `json:"free_qty"`
	FreeProductID *uint  `json:"free_product_id"`
	TimeStart     string `json:"time_start"`
	TimeEnd       string `json:"time_end"`
	DayOfWeek     string `json:"day_of_week"`
	ProductIDs    []uint `json:"product_ids"`
	Active        bool   `json:"active"`
}

type AppliedPromo struct {
	PromoID      uint   `json:"promo_id"`
	PromoName    string `json:"promo_name"`
	DiscountAmount int  `json:"discount_amount"`
}
