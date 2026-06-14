package models

import "time"

type AuditLog struct {
	ID         uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID     uint      `gorm:"not null;index" json:"user_id"`
	Username   string    `gorm:"type:varchar(100)" json:"username"`
	Role       string    `gorm:"type:varchar(20)" json:"role"`
	Action     string    `gorm:"type:varchar(50);not null;index" json:"action"`
	Entity     string    `gorm:"type:varchar(50)" json:"entity"`
	EntityID   string    `gorm:"type:varchar(50)" json:"entity_id"`
	MerchantID *uint     `json:"merchant_id,omitempty"`
	Detail     string    `gorm:"type:text" json:"detail"`
	IPAddress  string    `gorm:"type:varchar(50)" json:"ip_address"`
	UserAgent  string    `gorm:"type:text" json:"user_agent"`
	CreatedAt  time.Time `json:"created_at"`
}
