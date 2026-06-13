package services

import (
	"context"
	"point-of-sale/backend/app/models"
	"time"

	"gorm.io/gorm"
)

type ReportService interface {
	GetStockReport(ctx context.Context) (*models.StockReportResponse, error)
	GetCustomerReport(ctx context.Context, dateFrom, dateTo string, branchID *uint) (*models.CustomerReportResponse, error)
	GetProfitLoss(ctx context.Context, dateFrom, dateTo string, branchID *uint) (*models.ProfitLossResponse, error)
}

type reportService struct {
	db *gorm.DB
}

func NewReportService(db *gorm.DB) ReportService {
	return &reportService{db: db}
}

func (s *reportService) GetStockReport(ctx context.Context) (*models.StockReportResponse, error) {
	var products []models.Product
	if err := s.db.WithContext(ctx).Unscoped().Order("name asc").Find(&products).Error; err != nil {
		return nil, err
	}

	var totalStock, totalValue, lowCount, outCount int
	items := make([]models.StockReportItem, 0, len(products))

	for _, p := range products {
		stockVal := p.Stock * p.CostPrice
		if p.TrackStock {
			totalStock += p.Stock
			totalValue += stockVal
		}

		isLow := p.TrackStock && p.Stock > 0 && p.Stock <= 10
		if isLow {
			lowCount++
		}
		if p.TrackStock && p.Stock == 0 {
			outCount++
		}

		var lastLog models.StockLog
		lastMovement := ""
		if err := s.db.WithContext(ctx).Where("product_id = ?", p.ID).Order("created_at desc").First(&lastLog).Error; err == nil {
			lastMovement = lastLog.CreatedAt.Format("2006-01-02")
		}

		items = append(items, models.StockReportItem{
			ProductID:    p.ID,
			Name:         p.Name,
			Category:     p.Category,
			SKU:          p.SKU,
			Price:        p.Price,
			CostPrice:    p.CostPrice,
			Stock:        p.Stock,
			TrackStock:   p.TrackStock,
			StockValue:   stockVal,
			IsLowStock:   isLow || (!p.TrackStock && p.Stock == 0),
			LastMovement: lastMovement,
		})
	}

	return &models.StockReportResponse{
		TotalProducts:   len(products),
		TotalStock:      totalStock,
		TotalStockValue: totalValue,
		LowStockCount:   lowCount,
		OutOfStockCount: outCount,
		Items:           items,
	}, nil
}

func (s *reportService) GetCustomerReport(ctx context.Context, dateFrom, dateTo string, branchID *uint) (*models.CustomerReportResponse, error) {
	from, to := parseDateRange(dateFrom, dateTo)

	var customers []models.Customer
	if err := s.db.WithContext(ctx).Order("name asc").Find(&customers).Error; err != nil {
		return nil, err
	}

	var totalRevenue, totalCust int
	items := make([]models.CustomerReportItem, 0, len(customers))

	for _, c := range customers {
		var orderCount int
		var lastOrder time.Time
		orderQuery := s.db.WithContext(ctx).
			Model(&models.Order{}).
			Where("customer_id = ? AND created_at >= ? AND created_at <= ? AND order_status IN ?", c.ID, from, to.AddDate(0, 0, 1), []string{"COMPLETED", "DIKEMAS", "DIKIRIM", "SELESAI"})
		if branchID != nil {
			orderQuery = orderQuery.Where("branch_id = ?", *branchID)
		}
		orderQuery.Select("COALESCE(COUNT(*), 0), COALESCE(MAX(created_at), '1970-01-01'::timestamp)").
			Row().Scan(&orderCount, &lastOrder)

		if orderCount == 0 {
			continue
		}

		totalCust++
		totalRevenue += c.TotalSpent

		lastOrderStr := ""
		if !lastOrder.IsZero() && !lastOrder.Equal(time.Date(1970, 1, 1, 0, 0, 0, 0, time.UTC)) {
			lastOrderStr = lastOrder.Format("2006-01-02")
		}

		items = append(items, models.CustomerReportItem{
			CustomerID: c.ID,
			Name:       c.Name,
			Phone:      c.Phone,
			TotalSpent: c.TotalSpent,
			OrderCount: orderCount,
			LastOrder:  lastOrderStr,
		})
	}

	avgSpending := 0
	if totalCust > 0 {
		avgSpending = totalRevenue / totalCust
	}

	// if no items returned (may be no orders), include all customers with 0 orders
	if len(items) == 0 {
		for _, c := range customers {
			items = append(items, models.CustomerReportItem{
				CustomerID: c.ID,
				Name:       c.Name,
				Phone:      c.Phone,
				TotalSpent: c.TotalSpent,
				OrderCount: 0,
			})
		}
		totalCust = len(customers)
	}

	return &models.CustomerReportResponse{
		TotalCustomers: totalCust,
		TotalRevenue:   totalRevenue,
		AvgSpending:    avgSpending,
		Items:          items,
	}, nil
}

func (s *reportService) GetProfitLoss(ctx context.Context, dateFrom, dateTo string, branchID *uint) (*models.ProfitLossResponse, error) {
	from, to := parseDateRange(dateFrom, dateTo)

	var orders []models.Order
	dbQuery := s.db.WithContext(ctx).
		Preload("Branch").
		Preload("OrderItems").
		Preload("OrderItems.Product", func(db *gorm.DB) *gorm.DB {
			return db.Unscoped()
		}).
		Where("created_at >= ? AND created_at <= ?", from, to.AddDate(0, 0, 1)).
		Where("order_status IN ?", []string{"COMPLETED", "DIKEMAS", "DIKIRIM", "SELESAI"})
	if branchID != nil {
		dbQuery = dbQuery.Where("branch_id = ?", *branchID)
	}
	err := dbQuery.Order("created_at asc").Find(&orders).Error
	if err != nil {
		return nil, err
	}

	dailyMap := make(map[string]*models.ProfitLossItem)
	var totalRevenue, totalCost, totalTransactions int

	// Fetch expenses in date range
	var expenses []models.Expense
	expQuery := s.db.WithContext(ctx).
		Model(&models.Expense{}).
		Where("date >= ? AND date <= ?", from.Format("2006-01-02"), to.Format("2006-01-02"))
	if branchID != nil {
		expQuery = expQuery.Where("branch_id = ?", *branchID)
	}
	expQuery.Find(&expenses)

	totalExpense := 0
	totalModal := 0
	expenseMap := make(map[string]int)
	modalMap := make(map[string]int)
	for _, exp := range expenses {
		if exp.Category == "Modal" {
			totalModal += exp.Amount
			modalMap[exp.Date] += exp.Amount
		} else {
			totalExpense += exp.Amount
			expenseMap[exp.Date] += exp.Amount
		}
	}

	for _, order := range orders {
		totalRevenue += order.Total
		totalTransactions++

		orderCost := 0
		for _, item := range order.OrderItems {
			cp := item.CostPrice
			if cp <= 0 && item.Product.ID != 0 {
				cp = item.Product.CostPrice
			}
			if cp < 0 {
				cp = 0
			}
			orderCost += cp * item.Quantity
		}
		totalCost += orderCost

		dateKey := order.CreatedAt.Format("2006-01-02")
		if dailyMap[dateKey] == nil {
			dailyMap[dateKey] = &models.ProfitLossItem{
				Date:  dateKey,
				Label: order.CreatedAt.Format("02 Jan"),
			}
		}
		dailyMap[dateKey].Revenue += order.Total
		dailyMap[dateKey].Cost += orderCost
		dailyMap[dateKey].Transactions++
	}

	daily := make([]models.ProfitLossItem, 0)
	cur := from
	for !cur.After(to) {
		key := cur.Format("2006-01-02")
		if d, ok := dailyMap[key]; ok {
			d.Expense = expenseMap[key]
			d.Modal = modalMap[key]
			d.Profit = d.Revenue - d.Cost
			d.NetProfit = d.Revenue - d.Cost - d.Expense
			if d.Revenue > 0 {
				d.Margin = float64(d.Profit) / float64(d.Revenue) * 100
			}
			daily = append(daily, *d)
		} else {
			exp := expenseMap[key]
			mod := modalMap[key]
			daily = append(daily, models.ProfitLossItem{
				Date:      key,
				Label:     cur.Format("02 Jan"),
				Expense:   exp,
				Modal:     mod,
				NetProfit: -exp,
			})
		}
		cur = cur.AddDate(0, 0, 1)
	}

	grossProfit := totalRevenue - totalCost
	netProfit := grossProfit - totalExpense
	avgMargin := 0.0
	if totalRevenue > 0 {
		avgMargin = float64(grossProfit) / float64(totalRevenue) * 100
	}

	return &models.ProfitLossResponse{
		Summary: models.ProfitLossSummary{
			TotalRevenue:      totalRevenue,
			TotalCost:         totalCost,
			TotalModal:        totalModal,
			TotalExpense:      totalExpense,
			TotalProfit:       grossProfit,
			NetProfit:         netProfit,
			AvgMargin:         avgMargin,
			TotalTransactions: totalTransactions,
		},
		Daily: daily,
	}, nil
}

func parseDateRange(dateFrom, dateTo string) (time.Time, time.Time) {
	to := time.Now()
	from := to.AddDate(0, 0, -30)

	if dateFrom != "" {
		if parsed, err := time.Parse("2006-01-02", dateFrom); err == nil {
			from = parsed
		}
	}
	if dateTo != "" {
		if parsed, err := time.Parse("2006-01-02", dateTo); err == nil {
			to = parsed
		}
	}
	return from, to
}
