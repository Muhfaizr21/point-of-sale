package models

import "time"

type Ticket struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    *uint     `gorm:"index" json:"user_id,omitempty"`
	MerchantID *uint    `gorm:"index" json:"merchant_id,omitempty"`
	Name      string    `gorm:"type:varchar(100);not null" json:"name"`
	Email     string    `gorm:"type:varchar(255)" json:"email"`
	Subject   string    `gorm:"type:varchar(255);not null" json:"subject"`
	Status    string    `gorm:"type:varchar(20);default:'open'" json:"status"` // open, replied, closed
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Messages  []TicketMessage `gorm:"foreignKey:TicketID" json:"messages,omitempty"`
}

type TicketMessage struct {
	ID            uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	TicketID      uint      `gorm:"not null;index" json:"ticket_id"`
	Sender        string    `gorm:"type:varchar(20);not null" json:"sender"` // merchant / support
	SenderName    string    `gorm:"type:varchar(100)" json:"sender_name"`
	Message       string    `gorm:"type:text;not null" json:"message"`
	AttachmentURL string    `gorm:"type:text" json:"attachment_url,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

type CreateTicketRequest struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Subject string `json:"subject"`
	Message string `json:"message"`
}

type ReplyTicketRequest struct {
	Message       string `json:"message"`
	AttachmentURL string `json:"attachment_url,omitempty"`
}
