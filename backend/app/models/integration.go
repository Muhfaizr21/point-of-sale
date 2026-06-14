package models

import (
	"time"
)

type MerchantIntegration struct {
	ID         uint                   `gorm:"primaryKey;autoIncrement" json:"id"`
	MerchantID uint                   `gorm:"uniqueIndex:idx_merchant_app;not null" json:"merchant_id"`
	App        string                 `gorm:"uniqueIndex:idx_merchant_app;type:varchar(50);not null" json:"app"`
	Enabled    bool                   `gorm:"default:false" json:"enabled"`
	Config     map[string]interface{} `gorm:"serializer:json;type:jsonb;default:'{}'" json:"config"`
	CreatedAt  time.Time              `json:"created_at"`
	UpdatedAt  time.Time              `json:"updated_at"`
	Merchant   *Merchant              `gorm:"foreignKey:MerchantID" json:"merchant,omitempty"`
}

type UpsertIntegrationRequest struct {
	Enabled bool                    `json:"enabled"`
	Config  map[string]interface{}  `json:"config"`
}
