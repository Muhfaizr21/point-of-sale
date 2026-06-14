package models

import "time"

type PaymentTransaction struct {
	ID                    uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	MerchantSubscriptionID uint       `gorm:"not null;index" json:"merchant_subscription_id"`
	MerchantID            uint       `gorm:"not null;index" json:"merchant_id"`
	Amount                int64      `gorm:"not null" json:"amount"`
	Status                string     `gorm:"type:varchar(20);default:'pending'" json:"status"`
	PaymentMethod         string     `gorm:"type:varchar(50)" json:"payment_method"`
	InvoiceURL            string     `gorm:"type:text" json:"invoice_url"`
	PaidAt                *time.Time `json:"paid_at"`
	Notes                 string     `gorm:"type:text" json:"notes"`
	CreatedAt             time.Time  `json:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at"`
	MerchantSubscription  *MerchantSubscription `gorm:"foreignKey:MerchantSubscriptionID" json:"subscription,omitempty"`
	Merchant              *Merchant  `gorm:"foreignKey:MerchantID" json:"merchant,omitempty"`
}
