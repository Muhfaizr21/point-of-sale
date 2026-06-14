package models

import "time"

type Supplier struct {
	ID            uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	MerchantID    *uint     `gorm:"index" json:"merchant_id,omitempty"`
	BranchID      *uint     `gorm:"index" json:"branch_id,omitempty"`
	Name          string    `gorm:"type:varchar(255);not null" json:"name"`
	ContactPerson string    `gorm:"type:varchar(255)" json:"contact_person"`
	Phone         string    `gorm:"type:varchar(50)" json:"phone"`
	Email         string    `gorm:"type:varchar(255)" json:"email"`
	Address       string    `gorm:"type:text" json:"address"`
	Notes         string    `gorm:"type:text" json:"notes"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type CreateSupplierRequest struct {
	MerchantID     *uint  `json:"merchant_id,omitempty"`
	BranchID      *uint  `json:"branch_id,omitempty"`
	Name          string `json:"name"`
	ContactPerson string `json:"contact_person"`
	Phone         string `json:"phone"`
	Email         string `json:"email"`
	Address       string `json:"address"`
	Notes         string `json:"notes"`
}

type UpdateSupplierRequest struct {
	Name          string `json:"name"`
	ContactPerson string `json:"contact_person"`
	Phone         string `json:"phone"`
	Email         string `json:"email"`
	Address       string `json:"address"`
	Notes         string `json:"notes"`
}
