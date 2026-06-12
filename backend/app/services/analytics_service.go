package services

import (
	"context"
	"fmt"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/repositories"
	"time"

	"gorm.io/gorm"
)

type AnalyticsService interface {
	GetAnalytics(ctx context.Context, query *models.AnalyticsQuery) (*models.AnalyticsResponse, error)
}

type analyticsService struct {
	db        *gorm.DB
	orderRepo repositories.OrderRepository
}

func NewAnalyticsService(db *gorm.DB, orderRepo repositories.OrderRepository) AnalyticsService {
	return &analyticsService{
		db:        db,
		orderRepo: orderRepo,
	}
}

func (s *analyticsService) GetAnalytics(ctx context.Context, query *models.AnalyticsQuery) (*models.AnalyticsResponse, error) {
	// Set default date range (last 7 days)
	dateTo := time.Now()
	dateFrom := dateTo.AddDate(0, 0, -7)

	if query.DateFrom != "" {
		if parsed, err := time.Parse("2006-01-02", query.DateFrom); err == nil {
			dateFrom = parsed
		}
	}
	if query.DateTo != "" {
		if parsed, err := time.Parse("2006-01-02", query.DateTo); err == nil {
			dateTo = parsed
		}
	}

	// Get all orders in date range
	var orders []models.Order
	err := s.db.WithContext(ctx).
		Preload("OrderItems").
		Where("created_at >= ? AND created_at <= ?", dateFrom, dateTo.AddDate(0, 0, 1)).
		Where("order_status = ?", "COMPLETED").
		Order("created_at asc").
		Find(&orders).Error
	if err != nil {
		return nil, err
	}

	// Calculate summary
	var totalRevenue, totalTransactions int
	dailyMap := make(map[string]*models.DailySales)
	categoryMap := make(map[string]*models.CategorySales)
	paymentMap := make(map[string]*models.PaymentMethodSales)
	productMap := make(map[string]*models.TopProduct)
	cashierMap := make(map[string]*models.CashierSales)

	var products []models.Product
	if err := s.db.WithContext(ctx).Unscoped().Find(&products).Error; err != nil {
		return nil, err
	}
	productCatMap := make(map[uint]string)
	for _, p := range products {
		productCatMap[p.ID] = p.Category
	}

	for _, order := range orders {
		totalRevenue += order.Total
		totalTransactions++

		dateKey := order.CreatedAt.Format("2006-01-02")
		if dailyMap[dateKey] == nil {
			dailyMap[dateKey] = &models.DailySales{
				Date:  dateKey,
				Label: order.CreatedAt.Format("02 Jan"),
			}
		}
		dailyMap[dateKey].Revenue += order.Total
		dailyMap[dateKey].Transactions++

		// Category & Product breakdown
		for _, item := range order.OrderItems {
			// Category
			cat := "Lainnya"
			if c, ok := productCatMap[item.ProductID]; ok && c != "" {
				cat = c
			}
			if categoryMap[cat] == nil {
				categoryMap[cat] = &models.CategorySales{Category: cat}
			}
			categoryMap[cat].Sales += item.Quantity
			categoryMap[cat].Revenue += item.Price * item.Quantity

			// Product
			key := fmt.Sprintf("%d-%s", item.ProductID, item.ProductName)
			if productMap[key] == nil {
				productMap[key] = &models.TopProduct{
					ProductID:   item.ProductID,
					ProductName: item.ProductName,
					Category:    cat,
				}
			}
			productMap[key].Quantity += item.Quantity
			productMap[key].Revenue += item.Price * item.Quantity
		}

		// Payment method
		method := order.PaymentMethod
		if paymentMap[method] == nil {
			paymentMap[method] = &models.PaymentMethodSales{Method: method}
		}
		paymentMap[method].Count++
		paymentMap[method].Revenue += order.Total

		// Cashier
		cashierName := order.Cashier
		if cashierName == "" {
			cashierName = "Kasir"
		}
		if cashierMap[cashierName] == nil {
			cashierMap[cashierName] = &models.CashierSales{CashierName: cashierName}
		}
		cashierMap[cashierName].Transactions++
		cashierMap[cashierName].Revenue += order.Total
	}

	// Calculate averages and percentages
	avgOrderValue := 0
	if totalTransactions > 0 {
		avgOrderValue = totalRevenue / totalTransactions
	}

	// Fill daily sales for every day in range (zero-fill gaps)
	dailySales := s.fillDailySalesRange(dateFrom, dateTo, dailyMap)
	for i := range dailySales {
		if dailySales[i].Transactions > 0 {
			dailySales[i].AvgOrder = dailySales[i].Revenue / dailySales[i].Transactions
		}
	}

	categorySales := make([]models.CategorySales, 0, len(categoryMap))
	for _, c := range categoryMap {
		if totalRevenue > 0 {
			c.Percent = float64(c.Revenue) / float64(totalRevenue) * 100
		}
		categorySales = append(categorySales, *c)
	}

	paymentSales := make([]models.PaymentMethodSales, 0, len(paymentMap))
	for _, p := range paymentMap {
		if totalTransactions > 0 {
			p.Percent = float64(p.Count) / float64(totalTransactions) * 100
		}
		paymentSales = append(paymentSales, *p)
	}

	cashierSales := make([]models.CashierSales, 0, len(cashierMap))
	for _, c := range cashierMap {
		if totalTransactions > 0 {
			c.Percent = float64(c.Transactions) / float64(totalTransactions) * 100
		}
		cashierSales = append(cashierSales, *c)
	}

	// Sort cashier sales by revenue descending
	for i := 0; i < len(cashierSales)-1; i++ {
		for j := i + 1; j < len(cashierSales); j++ {
			if cashierSales[i].Revenue < cashierSales[j].Revenue {
				cashierSales[i], cashierSales[j] = cashierSales[j], cashierSales[i]
			}
		}
	}

	topProducts := make([]models.TopProduct, 0, len(productMap))
	for _, p := range productMap {
		topProducts = append(topProducts, *p)
	}

	// Sort and limit top products by revenue descending
	for i := 0; i < len(topProducts)-1; i++ {
		for j := i + 1; j < len(topProducts); j++ {
			if topProducts[i].Revenue < topProducts[j].Revenue {
				topProducts[i], topProducts[j] = topProducts[j], topProducts[i]
			}
		}
	}
	if len(topProducts) > 5 {
		topProducts = topProducts[:5]
	}

	// Calculate weekly sales
	weeklySales := s.calculateWeeklySales(orders, dateFrom, dateTo)

	// Find best day
	bestDay := models.DailySales{}
	for _, d := range dailySales {
		if d.Revenue > bestDay.Revenue {
			bestDay = d
		}
	}

	// Calculate real growth (compare with previous period of same length)
	revenueGrowth := s.calculateRevenueGrowth(ctx, dateFrom, dateTo, totalRevenue)

	return &models.AnalyticsResponse{
		Summary: models.SummaryStats{
			TotalRevenue:      totalRevenue,
			TotalTransactions: totalTransactions,
			AvgOrderValue:     avgOrderValue,
			RevenueGrowth:     revenueGrowth,
			BestDay:           bestDay,
		},
		DailySales:    dailySales,
		CategorySales: categorySales,
		PaymentSales:  paymentSales,
		TopProducts:   topProducts,
		WeeklySales:   weeklySales,
		CashierSales:  cashierSales,
	}, nil
}

func (s *analyticsService) fillDailySalesRange(dateFrom, dateTo time.Time, dailyMap map[string]*models.DailySales) []models.DailySales {
	var result []models.DailySales
	current := dateFrom
	for !current.After(dateTo) {
		dateKey := current.Format("2006-01-02")
		if d, ok := dailyMap[dateKey]; ok {
			result = append(result, *d)
		} else {
			result = append(result, models.DailySales{
				Date:  dateKey,
				Label: current.Format("02 Jan"),
			})
		}
		current = current.AddDate(0, 0, 1)
	}
	return result
}

func (s *analyticsService) calculateRevenueGrowth(ctx context.Context, dateFrom, dateTo time.Time, currentRevenue int) float64 {
	periodDays := int(dateTo.Sub(dateFrom).Hours()/24) + 1
	prevTo := dateFrom.AddDate(0, 0, -1)
	prevFrom := dateFrom.AddDate(0, 0, -periodDays)

	var prevRevenue int
	s.db.WithContext(ctx).
		Model(&models.Order{}).
		Where("created_at >= ? AND created_at <= ?", prevFrom, prevTo.AddDate(0, 0, 1)).
		Where("order_status = ?", "COMPLETED").
		Select("COALESCE(SUM(total), 0)").
		Scan(&prevRevenue)

	if prevRevenue <= 0 {
		return 0
	}
	return float64(currentRevenue-prevRevenue) / float64(prevRevenue) * 100
}

func (s *analyticsService) calculateWeeklySales(orders []models.Order, dateFrom, dateTo time.Time) []models.WeeklySales {
	weeks := make([]*models.WeeklySales, 0)

	current := dateFrom
	weekNum := 1
	for !current.After(dateTo) {
		weekStart := current
		weekEnd := current.AddDate(0, 0, 6)
		if weekEnd.After(dateTo) {
			weekEnd = dateTo
		}

		key := fmt.Sprintf("Week %d", weekNum)
		w := &models.WeeklySales{
			Week:      key,
			StartDate: weekStart.Format("2006-01-02"),
			EndDate:   weekEnd.Format("2006-01-02"),
		}
		weeks = append(weeks, w)

		current = current.AddDate(0, 0, 7)
		weekNum++
	}

	// Fill in order data
	for _, order := range orders {
		orderDate := order.CreatedAt
		for _, w := range weeks {
			start, _ := time.Parse("2006-01-02", w.StartDate)
			end, _ := time.Parse("2006-01-02", w.EndDate)
			if !orderDate.Before(start) && !orderDate.After(end.AddDate(0, 0, 1)) {
				w.Revenue += order.Total
				w.Transactions++
				break
			}
		}
	}

	// Calculate growth between weeks (deterministic order)
	var prevRevenue int
	for _, w := range weeks {
		if prevRevenue > 0 {
			w.Growth = float64(w.Revenue-prevRevenue) / float64(prevRevenue) * 100
		}
		prevRevenue = w.Revenue
	}

	result := make([]models.WeeklySales, len(weeks))
	for i, w := range weeks {
		result[i] = *w
	}
	return result
}
