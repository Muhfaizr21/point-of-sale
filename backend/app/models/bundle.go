package models

import "time"

type Bundle struct {
	ID        uint         `gorm:"primaryKey;autoIncrement" json:"id"`
	BranchID  *uint        `gorm:"index" json:"branch_id,omitempty"`
	Name      string       `gorm:"type:varchar(255);not null" json:"name"`
	Price     int          `gorm:"type:integer;not null" json:"price"`
	Icon      string       `gorm:"type:varchar(255)" json:"icon"`
	Active    bool         `gorm:"default:true" json:"active"`
	Items     []BundleItem `gorm:"foreignKey:BundleID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"items"`
	CreatedAt time.Time    `json:"created_at"`
	UpdatedAt time.Time    `json:"updated_at"`
}

type BundleItem struct {
	ID        uint    `gorm:"primaryKey;autoIncrement" json:"id"`
	BundleID  uint    `gorm:"not null" json:"bundle_id"`
	ProductID uint    `gorm:"not null" json:"product_id"`
	Quantity  int     `gorm:"not null" json:"quantity"`
	Product   Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}

type BundleOrderRequest struct {
	BundleID uint `json:"bundle_id"`
	Quantity int  `json:"quantity"`
}

type CreateBundleRequest struct {
	BranchID *uint                 `json:"branch_id,omitempty"`
	Name     string                `json:"name"`
	Price    int                   `json:"price"`
	Icon     string                `json:"icon"`
	Items    []CreateBundleItemReq `json:"items"`
	Active   *bool                 `json:"active,omitempty"`
}

type CreateBundleItemReq struct {
	ProductID uint `json:"product_id"`
	Quantity  int  `json:"quantity"`
}

type UpdateBundleRequest struct {
	Name   string                 `json:"name"`
	Price  int                    `json:"price"`
	Icon   string                 `json:"icon"`
	Items  []CreateBundleItemReq  `json:"items"`
	Active *bool                  `json:"active,omitempty"`
}
