package models

import "time"

type SubscriptionPlan struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string    `gorm:"type:varchar(100);not null" json:"name"`
	Code        string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"code"`
	PriceMonthly int      `gorm:"type:integer;not null" json:"price_monthly"`
	PriceYearly int       `gorm:"type:integer;not null" json:"price_yearly"`
	MaxBranches int       `gorm:"type:integer;default:1" json:"max_branches"`
	MaxUsers    int       `gorm:"type:integer;default:1" json:"max_users"`
	Features    []string  `gorm:"serializer:json;type:jsonb;default:'[]'" json:"features"`
	Active      bool      `gorm:"default:true" json:"active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type MerchantSubscription struct {
	ID              uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	MerchantID      uint      `gorm:"uniqueIndex;not null" json:"merchant_id"`
	PlanID          uint      `gorm:"not null" json:"plan_id"`
	BillingPeriod   string    `gorm:"type:varchar(10);default:'monthly'" json:"billing_period"` // monthly / yearly
	Status          string    `gorm:"type:varchar(20);default:'active'" json:"status"` // active / trial / expired / cancelled
	StartDate       time.Time `json:"start_date"`
	EndDate         time.Time `json:"end_date"`
	TrialEndDate    *time.Time `json:"trial_end_date,omitempty"`
	AutoRenew       bool      `gorm:"default:true" json:"auto_renew"`
	PaymentMethod   string    `gorm:"type:varchar(50)" json:"payment_method"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	Plan            *SubscriptionPlan `gorm:"foreignKey:PlanID" json:"plan,omitempty"`
	Merchant        *Merchant         `gorm:"foreignKey:MerchantID" json:"merchant,omitempty"`
}

type CreatePlanRequest struct {
	Name         string   `json:"name"`
	Code         string   `json:"code"`
	PriceMonthly int      `json:"price_monthly"`
	PriceYearly  int      `json:"price_yearly"`
	MaxBranches  int      `json:"max_branches"`
	MaxUsers     int      `json:"max_users"`
	Features     []string `json:"features"`
}

type AssignSubscriptionRequest struct {
	MerchantID    uint   `json:"merchant_id"`
	PlanID        uint   `json:"plan_id"`
	BillingPeriod string `json:"billing_period"`
}
