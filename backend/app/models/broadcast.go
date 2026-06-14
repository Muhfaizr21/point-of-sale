package models

import "time"

type Broadcast struct {
	ID               uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Title            string    `gorm:"type:varchar(255);not null" json:"title"`
	Message          string    `gorm:"type:text;not null" json:"message"`
	Type             string    `gorm:"type:varchar(20);default:'general'" json:"type"` // general / merchant
	TargetMerchantIDs []uint   `gorm:"serializer:json;type:jsonb;default:'[]'" json:"target_merchant_ids"`
	CreatedByID      uint      `json:"created_by_id"`
	CreatedAt        time.Time `json:"created_at"`
}

type BroadcastRead struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	BroadcastID uint      `gorm:"uniqueIndex:idx_broadcast_merchant;not null" json:"broadcast_id"`
	MerchantID  uint      `gorm:"uniqueIndex:idx_broadcast_merchant;not null" json:"merchant_id"`
	ReadAt      time.Time `json:"read_at"`
}

type CreateBroadcastRequest struct {
	Title            string `json:"title"`
	Message          string `json:"message"`
	Type             string `json:"type"`
	TargetMerchantIDs []uint `json:"target_merchant_ids,omitempty"`
}
