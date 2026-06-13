package models

import (
	"time"
)

var ValidPaymentMethods = map[string]bool{
	"CASH":     true,
	"CARD":     true,
	"WALLET":   true,
	"E_WALLET": true,
	"TRANSFER": true,
	"SPLIT":    true,
}

var ValidOrderStatuses = []string{"COMPLETED", "DIKEMAS", "DIKIRIM", "SELESAI"}

var ValidStatusTransitions = map[string][]string{
	"COMPLETED": {"DIKEMAS", "DIKIRIM", "SELESAI"},
	"DIKEMAS":   {"DIKIRIM", "COMPLETED"},
	"DIKIRIM":   {"SELESAI", "DIKEMAS", "COMPLETED"},
	"SELESAI":   {"DIKIRIM", "COMPLETED"},
}

type Order struct {
	ID             uint            `gorm:"primaryKey;autoIncrement" json:"id"`
	InvoiceNumber  string          `gorm:"type:varchar(100);uniqueIndex;not null" json:"invoice_number"`
	CustomerID     *uint           `json:"customer_id,omitempty"`
	Customer       string          `gorm:"type:varchar(255);default:'Umum'" json:"customer"`
	Cashier        string          `gorm:"type:varchar(100);default:'Kasir'" json:"cashier"`
	Subtotal       int             `gorm:"type:integer;not null" json:"subtotal"`
	Tax            int             `gorm:"type:integer;not null" json:"tax"`
	Discount       int             `gorm:"type:integer;default:0" json:"discount"`
	PromoDiscount  int             `gorm:"type:integer;default:0" json:"promo_discount"`
	Total          int             `gorm:"type:integer;not null" json:"total"`
	PaymentMethod  string          `gorm:"type:varchar(50);not null" json:"payment_method"`
	TaxRate        int             `gorm:"type:integer;default:0" json:"tax_rate"`
	ServiceCharge  int             `gorm:"type:integer;default:0" json:"service_charge"`
	RoundingDiff   int             `gorm:"type:integer;default:0" json:"rounding_diff"`
	SplitPayments  []SplitPayment  `gorm:"serializer:json;type:jsonb;default:'[]'" json:"split_payments,omitempty"`
	PaymentStatus  string          `gorm:"type:varchar(50);default:'COMPLETED'" json:"payment_status"`
	OrderStatus    string          `gorm:"type:varchar(50);default:'COMPLETED'" json:"order_status"`
	Notes          string          `gorm:"type:text" json:"notes"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
	OrderItems     []OrderItem     `gorm:"foreignKey:OrderID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"items"`
}

type OrderItem struct {
	ID            uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderID       uint   `gorm:"not null" json:"order_id"`
	ProductID     uint   `gorm:"not null" json:"product_id"`
	ProductName   string `gorm:"type:varchar(255);not null" json:"product_name"`
	VariationName string `gorm:"type:varchar(100)" json:"variation_name,omitempty"`
	Price         int    `gorm:"type:integer;not null" json:"price"`
	CostPrice     int    `gorm:"type:integer;default:0" json:"cost_price"`
	Quantity      int    `gorm:"type:integer;not null" json:"quantity"`
	IsBundle      bool   `gorm:"default:false" json:"is_bundle"`
	BundleID      *uint  `json:"bundle_id,omitempty"`
	BundleName    string `gorm:"type:varchar(255)" json:"bundle_name,omitempty"`
	Product       Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}

type CreateOrderItemRequest struct {
	ProductID     uint   `json:"product_id"`
	VariationName string `json:"variation_name,omitempty"`
	Quantity      int    `json:"quantity"`
}

type SplitPaymentRequest struct {
	Method string `json:"method"`
	Amount int    `json:"amount"`
}

type CreateOrderRequest struct {
	PaymentMethod     string                `json:"payment_method"`
	SplitPayments     []SplitPaymentRequest `json:"split_payments,omitempty"`
	Items             []CreateOrderItemRequest `json:"items"`
	Bundles           []BundleOrderRequest  `json:"bundles,omitempty"`
	Customer          string                `json:"customer,omitempty"`
	CustomerID        *uint                 `json:"customer_id,omitempty"`
	Discount          int                   `json:"discount,omitempty"`
	TaxRate           int                   `json:"tax_rate,omitempty"`
	ServiceChargeRate int                   `json:"service_charge_rate,omitempty"`
	Rounding          bool                  `json:"rounding,omitempty"`
	Notes             string                `json:"notes,omitempty"`
}

type UpdateOrderRequest struct {
	OrderStatus *string `json:"order_status"`
	Notes       *string `json:"notes"`
}

type RefundOrderRequest struct {
	Notes string `json:"notes"`
}

// Query params for filtering orders
type OrderQuery struct {
	Page         int    `json:"page"`
	Limit        int    `json:"limit"`
	Search       string `json:"search"`
	PaymentMethod string `json:"payment_method"`
	DateFrom     string `json:"date_from"`
	DateTo       string `json:"date_to"`
	Status       string `json:"status"`
	SortBy       string `json:"sort_by"`
	SortOrder    string `json:"sort_order"`
}

// Paginated response
type OrderListResponse struct {
	Data       []Order  `json:"data"`
	Pagination Pagination `json:"pagination"`
}

type Pagination struct {
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	TotalItems int `json:"total_items"`
	TotalPages int `json:"total_pages"`
}

// Analytics models
type AnalyticsQuery struct {
	DateFrom string `json:"date_from"`
	DateTo   string `json:"date_to"`
}

type DailySales struct {
	Date         string `json:"date"`
	Label        string `json:"label"`
	Revenue      int    `json:"revenue"`
	Transactions int    `json:"transactions"`
	AvgOrder     int    `json:"avg_order"`
}

type CategorySales struct {
	Category string `json:"category"`
	Sales    int    `json:"sales"`
	Revenue  int    `json:"revenue"`
	Percent  float64 `json:"percent"`
}

type PaymentMethodSales struct {
	Method  string `json:"method"`
	Count   int    `json:"count"`
	Revenue int    `json:"revenue"`
	Percent float64 `json:"percent"`
}

type SplitPayment struct {
	Method string `json:"method"`
	Amount int    `json:"amount"`
}

type TopProduct struct {
	ProductID   uint   `json:"product_id"`
	ProductName string `json:"product_name"`
	Category    string `json:"category"`
	Quantity    int    `json:"quantity"`
	Revenue     int    `json:"revenue"`
}

type WeeklySales struct {
	Week        string `json:"week"`
	StartDate   string `json:"start_date"`
	EndDate     string `json:"end_date"`
	Revenue     int    `json:"revenue"`
	Transactions int   `json:"transactions"`
	Growth      float64 `json:"growth"`
}

type CashierSales struct {
	CashierName  string  `json:"cashier_name"`
	Transactions int     `json:"transactions"`
	Revenue      int     `json:"revenue"`
	Percent      float64 `json:"percent"`
}

type AnalyticsResponse struct {
	Summary      SummaryStats       `json:"summary"`
	DailySales   []DailySales       `json:"daily_sales"`
	CategorySales []CategorySales   `json:"category_sales"`
	PaymentSales []PaymentMethodSales `json:"payment_sales"`
	TopProducts  []TopProduct       `json:"top_products"`
	WeeklySales  []WeeklySales      `json:"weekly_sales"`
	CashierSales []CashierSales     `json:"cashier_sales"`
}

type SummaryStats struct {
	TotalRevenue      int     `json:"total_revenue"`
	TotalTransactions int     `json:"total_transactions"`
	AvgOrderValue     int     `json:"avg_order_value"`
	RevenueGrowth     float64 `json:"revenue_growth"`
	BestDay           DailySales `json:"best_day"`
}
