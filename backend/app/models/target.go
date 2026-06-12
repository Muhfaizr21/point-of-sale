package models

import "time"

type DailyTarget struct {
	ID                uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Date              string    `gorm:"type:varchar(10);uniqueIndex;not null" json:"date"` // Format: YYYY-MM-DD
	RevenueTarget     int       `gorm:"type:integer;not null" json:"revenue_target"`
	TransactionTarget int       `gorm:"type:integer;not null" json:"transaction_target"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type UpsertTargetRequest struct {
	Date              string `json:"date"` // Format: YYYY-MM-DD
	RevenueTarget     int    `json:"revenue_target"`
	TransactionTarget int    `json:"transaction_target"`
}
