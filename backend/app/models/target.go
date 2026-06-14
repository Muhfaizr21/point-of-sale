package models

import "time"

type DailyTarget struct {
	ID                uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	MerchantID        *uint     `gorm:"uniqueIndex:idx_target_date_branch" json:"merchant_id,omitempty"`
	BranchID          *uint     `gorm:"uniqueIndex:idx_target_date_branch" json:"branch_id,omitempty"`
	Date              string    `gorm:"type:varchar(10);uniqueIndex:idx_target_date_branch;not null" json:"date"`
	RevenueTarget     int       `gorm:"type:integer;not null" json:"revenue_target"`
	TransactionTarget int       `gorm:"type:integer;not null" json:"transaction_target"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type UpsertTargetRequest struct {
	MerchantID        *uint  `json:"merchant_id,omitempty"`
	BranchID          *uint  `json:"-"`
	Date              string `json:"date"`
	RevenueTarget     int    `json:"revenue_target"`
	TransactionTarget int    `json:"transaction_target"`
}
