package models

import "time"

type Expense struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Date        string    `gorm:"type:date;index;not null" json:"date"`
	Description string    `gorm:"type:varchar(255);not null" json:"description"`
	Amount      int       `gorm:"type:integer;not null" json:"amount"`
	Category    string    `gorm:"type:varchar(100);index" json:"category"`
	Notes       string    `gorm:"type:text" json:"notes"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateExpenseRequest struct {
	Date        string `json:"date"`
	Description string `json:"description"`
	Amount      int    `json:"amount"`
	Category    string `json:"category"`
	Notes       string `json:"notes"`
}

type UpdateExpenseRequest struct {
	Date        string `json:"date"`
	Description string `json:"description"`
	Amount      int    `json:"amount"`
	Category    string `json:"category"`
	Notes       string `json:"notes"`
}

type ExpenseQuery struct {
	DateFrom string `json:"date_from"`
	DateTo   string `json:"date_to"`
	Category string `json:"category"`
	Search   string `json:"search"`
	Page     int    `json:"page"`
	Limit    int    `json:"limit"`
	SortBy   string `json:"sort_by"`
	SortOrder string `json:"sort_order"`
}

type ExpenseListResponse struct {
	Data       []Expense  `json:"data"`
	Pagination Pagination `json:"pagination"`
}
