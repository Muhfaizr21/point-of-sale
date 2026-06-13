package models

type StockReportItem struct {
	ProductID    uint   `json:"product_id"`
	Name         string `json:"name"`
	Category     string `json:"category"`
	SKU          string `json:"sku"`
	Price        int    `json:"price"`
	CostPrice    int    `json:"cost_price"`
	Stock        int    `json:"stock"`
	TrackStock   bool   `json:"track_stock"`
	StockValue   int    `json:"stock_value"`
	IsLowStock   bool   `json:"is_low_stock"`
	LastMovement string `json:"last_movement,omitempty"`
}

type StockReportResponse struct {
	TotalProducts  int              `json:"total_products"`
	TotalStock     int              `json:"total_stock"`
	TotalStockValue int             `json:"total_stock_value"`
	LowStockCount  int              `json:"low_stock_count"`
	OutOfStockCount int             `json:"out_of_stock_count"`
	Items          []StockReportItem `json:"items"`
}

type CustomerReportItem struct {
	CustomerID   uint   `json:"customer_id"`
	Name         string `json:"name"`
	Phone        string `json:"phone"`
	TotalSpent   int    `json:"total_spent"`
	OrderCount   int    `json:"order_count"`
	LastOrder    string `json:"last_order,omitempty"`
}

type CustomerReportResponse struct {
	TotalCustomers int                 `json:"total_customers"`
	TotalRevenue   int                 `json:"total_revenue"`
	AvgSpending    int                 `json:"avg_spending"`
	Items          []CustomerReportItem `json:"items"`
}

type ProfitLossItem struct {
	Date         string  `json:"date"`
	Label        string  `json:"label"`
	Revenue      int     `json:"revenue"`
	Cost         int     `json:"cost"`
	Expense      int     `json:"expense"`
	Modal        int     `json:"modal"`
	Profit       int     `json:"profit"`
	NetProfit    int     `json:"net_profit"`
	Margin       float64 `json:"margin"`
	Transactions int     `json:"transactions"`
}

type ProfitLossSummary struct {
	TotalRevenue      int     `json:"total_revenue"`
	TotalCost         int     `json:"total_cost"`
	TotalModal        int     `json:"total_modal"`
	TotalExpense      int     `json:"total_expense"`
	TotalProfit       int     `json:"total_profit"`
	NetProfit         int     `json:"net_profit"`
	AvgMargin         float64 `json:"avg_margin"`
	TotalTransactions int     `json:"total_transactions"`
}

type ProfitLossResponse struct {
	Summary ProfitLossSummary `json:"summary"`
	Daily   []ProfitLossItem  `json:"daily"`
}

type CashierReportItem struct {
	CashierName  string  `json:"cashier_name"`
	Transactions int     `json:"transactions"`
	Revenue      int     `json:"revenue"`
	Percent      float64 `json:"percent"`
}

type PaymentReportItem struct {
	Method  string  `json:"method"`
	Count   int     `json:"count"`
	Revenue int     `json:"revenue"`
	Percent float64 `json:"percent"`
}
