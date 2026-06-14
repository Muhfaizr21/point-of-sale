package repositories

import (
	"context"
	"point-of-sale/backend/app/models"
	"time"
	"gorm.io/gorm"
)

type SuperadminRepository interface {
	GetRevenueStats(ctx context.Context) (*RevenueStats, error)
	GetMonthlyRevenue(ctx context.Context, months int) ([]MonthlyRevenue, error)
	GetAllOrders(ctx context.Context, page, limit int, merchantID uint, status, dateFrom, dateTo string) ([]models.Order, int64, error)
	GetOrderStats(ctx context.Context) (*OrderStats, error)
	GetRevenuePerMerchant(ctx context.Context, page, limit int) ([]MerchantRevenue, int64, error)
	GetPaymentTransactions(ctx context.Context, page, limit int, status string) ([]models.PaymentTransaction, int64, error)
	GetPaymentStats(ctx context.Context) (*PaymentStats, error)
	GetSystemHealth(ctx context.Context) (*SystemHealth, error)
	GetAuditLogs(ctx context.Context, page, limit int, action, userID string) ([]models.AuditLog, int64, error)
	GetPlatformSettings(ctx context.Context) (map[string]string, error)
	UpsertPlatformSetting(ctx context.Context, key, value string) error
	GetContactMessages(ctx context.Context, page, limit int, status string) ([]models.ContactMessage, int64, error)
	MarkContactRead(ctx context.Context, id uint, userID uint) error
	DeleteContactMessage(ctx context.Context, id uint) error
	CreateContactMessage(ctx context.Context, msg *models.ContactMessage) error
	GetTickets(ctx context.Context, page, limit int, status string) ([]models.Ticket, int64, error)
	GetTicketByID(ctx context.Context, id uint) (*models.Ticket, error)
	GetMyTickets(ctx context.Context, userID, merchantID uint) ([]models.Ticket, error)
	CreateTicket(ctx context.Context, t *models.Ticket) error
	AddTicketMessage(ctx context.Context, m *models.TicketMessage) error
	UpdateTicketStatus(ctx context.Context, id uint, status string) error
	GetDemographics(ctx context.Context) (*DemographicsData, error)
	GetExportData(ctx context.Context, dateFrom, dateTo string) (*ExportData, error)
}

type ExportData struct {
	Period      string           `json:"period"`
	GeneratedAt string           `json:"generated_at"`
	Merchants   *ExportMerchants `json:"merchants"`
	Orders      *ExportOrders    `json:"orders"`
	Revenue     *ExportRevenue   `json:"revenue"`
	TopMerchants []TopMerchant   `json:"top_merchants"`
	MonthlyData  []MonthlyRevenue `json:"monthly_data"`
}

type ExportMerchants struct {
	Total  int64 `json:"total"`
	Active int64 `json:"active"`
	Trial  int64 `json:"trial"`
	New    int64 `json:"new"`
}

type ExportOrders struct {
	Total     int64 `json:"total"`
	Completed int64 `json:"completed"`
	Revenue   int64 `json:"revenue"`
}

type ExportRevenue struct {
	Total     int64 `json:"total"`
	MRR       int64 `json:"mrr"`
	PerMerchant int64 `json:"per_merchant"`
}

type DemographicsData struct {
	TotalMerchants int64              `json:"total_merchants"`
	TotalBranches  int64              `json:"total_branches"`
	TotalCities    int64              `json:"total_cities"`
	CityDist       []CityDist         `json:"city_distribution"`
	Branches       []models.Branch    `json:"branches"`
	RecentMerchants []RecentMerchant  `json:"recent_merchants"`
}

type CityDist struct {
	City    string `json:"city"`
	Count   int64  `json:"count"`
	Merchants int64 `json:"merchants"`
}

type RecentMerchant struct {
	ID        uint   `json:"id"`
	Name      string `json:"name"`
	Code      string `json:"code"`
	City      string `json:"city"`
	CreatedAt string `json:"created_at"`
}

type RevenueStats struct {
	TotalMerchants    int64   `json:"total_merchants"`
	ActiveSubs        int64   `json:"active_subscriptions"`
	TrialSubs         int64   `json:"trial_subscriptions"`
	ExpiredSubs       int64   `json:"expired_subscriptions"`
	MRR               int64   `json:"mrr"`
	ChurnRate         float64 `json:"churn_rate"`
	TotalOrdersMonth  int64   `json:"total_orders_month"`
	TotalRevenueMonth int64   `json:"total_revenue_month"`
	NewMerchantsMonth int64   `json:"new_merchants_month"`
	TrialConversion   float64 `json:"trial_conversion"`
	PlanDistribution  []PlanDist  `json:"plan_distribution"`
	PaymentMethods    []PayMethod `json:"payment_methods"`
	TopMerchants      []TopMerchant `json:"top_merchants"`
	WeekdayDist       []WeekdayDist `json:"weekday_distribution"`
}

type PlanDist struct {
	Plan      string `json:"plan"`
	Code      string `json:"code"`
	Count     int64  `json:"count"`
	MonthlyMRR int64 `json:"monthly_mrr"`
}

type PayMethod struct {
	Method string `json:"method"`
	Count  int64  `json:"count"`
	Total  int64  `json:"total"`
}

type TopMerchant struct {
	ID    uint   `json:"id"`
	Name  string `json:"name"`
	Code  string `json:"code"`
	Total int64  `json:"total"`
	Orders int64 `json:"orders"`
}

type WeekdayDist struct {
	Day   string `json:"day"`
	Count int64  `json:"count"`
	Total int64  `json:"total"`
}

type OrderStats struct {
	TotalOrders    int64 `json:"total_orders"`
	TotalRevenue   int64 `json:"total_revenue"`
	AvgOrderValue  int64 `json:"avg_order_value"`
	Completed      int64 `json:"completed"`
	Pending        int64 `json:"pending"`
	Failed         int64 `json:"failed"`
	Refunded       int64 `json:"refunded"`
	TodayOrders    int64 `json:"today_orders"`
	TodayRevenue   int64 `json:"today_revenue"`
	CashAmount     int64 `json:"cash_amount"`
	TransferAmount int64 `json:"transfer_amount"`
	EWalletAmount  int64 `json:"ewallet_amount"`
	CardAmount     int64 `json:"card_amount"`
}

type PaymentStats struct {
	TotalCollected int64 `json:"total_collected"`
	TotalPending   int64 `json:"total_pending"`
	TotalFailed    int64 `json:"total_failed"`
	TotalRefunded  int64 `json:"total_refunded"`
	ThisMonth      int64 `json:"this_month"`
	LastMonth      int64 `json:"last_month"`
	PaidCount      int64 `json:"paid_count"`
	PendingCount   int64 `json:"pending_count"`
}

type MonthlyRevenue struct {
	Month        string `json:"month"`
	Revenue      int64  `json:"revenue"`
	NewMerchants int64  `json:"new_merchants"`
	Churned      int64  `json:"churned"`
}

type MerchantRevenue struct {
	MerchantID         uint    `json:"merchant_id"`
	Name               string  `json:"name"`
	Code               string  `json:"code"`
	Email              string  `json:"email"`
	PlanName           string  `json:"plan_name"`
	SubscriptionStatus string  `json:"subscription_status"`
	MonthlyFee         int     `json:"monthly_fee"`
	TotalOrders        int64   `json:"total_orders"`
	TotalRevenue       int64   `json:"total_revenue"`
	LastPayment        *time.Time `json:"last_payment,omitempty"`
	Active             bool    `json:"active"`
}

type SystemHealth struct {
	Database         string `json:"database"`
	API              string `json:"api"`
	Storage          string `json:"storage"`
	Uptime           string `json:"uptime"`
	ActiveMerchants  int64  `json:"active_merchants"`
	TotalOrdersToday int64  `json:"total_orders_today"`
	DBLatency        string `json:"db_latency"`
}

type superadminRepository struct{ db *gorm.DB }

func NewSuperadminRepository(db *gorm.DB) SuperadminRepository {
	return &superadminRepository{db: db}
}

func (r *superadminRepository) GetRevenueStats(ctx context.Context) (*RevenueStats, error) {
	var stats RevenueStats
	r.db.WithContext(ctx).Model(&models.Merchant{}).Count(&stats.TotalMerchants)

	r.db.WithContext(ctx).Model(&models.MerchantSubscription{}).
		Where("status = ?", "active").Count(&stats.ActiveSubs)
	r.db.WithContext(ctx).Model(&models.MerchantSubscription{}).
		Where("status = ?", "trial").Count(&stats.TrialSubs)
	r.db.WithContext(ctx).Model(&models.MerchantSubscription{}).
		Where("status IN ?", []string{"expired", "cancelled"}).Count(&stats.ExpiredSubs)

	var activeSubs []models.MerchantSubscription
	r.db.WithContext(ctx).Preload("Plan").Where("status IN ?", []string{"active", "trial"}).Find(&activeSubs)
	for _, s := range activeSubs {
		if s.Plan != nil {
			stats.MRR += int64(s.Plan.PriceMonthly)
		}
	}

	now := time.Now()
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	r.db.WithContext(ctx).Model(&models.Order{}).Where("created_at >= ?", monthStart).Count(&stats.TotalOrdersMonth)

	r.db.WithContext(ctx).Model(&models.Order{}).Select("COALESCE(SUM(total),0)").Where("created_at >= ?", monthStart).Scan(&stats.TotalRevenueMonth)

	r.db.WithContext(ctx).Model(&models.Merchant{}).Where("created_at >= ?", monthStart).Count(&stats.NewMerchantsMonth)

	// Churn rate: (expired last month / total active previous month) * 100
	lastMonthStart := monthStart.AddDate(0, -1, 0)
	lastMonthEnd := monthStart.Add(-time.Nanosecond)
	var expiredLastMonth int64
	r.db.WithContext(ctx).Model(&models.MerchantSubscription{}).
		Where("status = ? AND updated_at >= ? AND updated_at <= ?", "expired", lastMonthStart, lastMonthEnd).Count(&expiredLastMonth)
	var totalPrev int64
	r.db.WithContext(ctx).Model(&models.Merchant{}).Where("created_at < ?", monthStart).Count(&totalPrev)
	if totalPrev > 0 {
		stats.ChurnRate = float64(expiredLastMonth) / float64(totalPrev) * 100
	}

	// Trial conversion: trial → active
	var totalTrialEnded int64
	r.db.WithContext(ctx).Model(&models.MerchantSubscription{}).
		Where("(status = ? OR status = ?) AND updated_at >= ?", "active", "expired", lastMonthStart).Count(&totalTrialEnded)
	if totalTrialEnded > 0 {
		var trialConverted int64
		r.db.WithContext(ctx).Model(&models.MerchantSubscription{}).
			Where("status = ? AND updated_at >= ?", "active", lastMonthStart).Count(&trialConverted)
		stats.TrialConversion = float64(trialConverted) / float64(totalTrialEnded) * 100
	}

	// Plan distribution
	var planDists []PlanDist
	r.db.WithContext(ctx).Raw(`
		SELECT sp.name AS plan, sp.code, COUNT(ms.id) AS count, COALESCE(SUM(sp.price_monthly),0) AS monthly_mrr
		FROM subscription_plans sp
		LEFT JOIN merchant_subscriptions ms ON ms.plan_id = sp.id AND ms.status IN ('active','trial')
		GROUP BY sp.id, sp.name, sp.code
		ORDER BY count DESC
	`).Scan(&planDists)
	stats.PlanDistribution = planDists

	// Payment method breakdown
	var payMethods []PayMethod
	r.db.WithContext(ctx).Raw(`
		SELECT COALESCE(NULLIF(payment_method,''),'UNKNOWN') AS method, COUNT(*) AS count, COALESCE(SUM(total),0) AS total
		FROM orders
		GROUP BY method ORDER BY total DESC
	`).Scan(&payMethods)
	stats.PaymentMethods = payMethods

	// Top 10 merchants by total revenue
	var topM []TopMerchant
	r.db.WithContext(ctx).Raw(`
		SELECT m.id, m.name, m.code, COUNT(o.id) AS orders, COALESCE(SUM(o.total),0) AS total
		FROM merchants m
		LEFT JOIN orders o ON o.merchant_id = m.id
		GROUP BY m.id, m.name, m.code
		ORDER BY total DESC LIMIT 10
	`).Scan(&topM)
	stats.TopMerchants = topM

	// Weekday distribution
	var wd []WeekdayDist
	r.db.WithContext(ctx).Raw(`
		SELECT TO_CHAR(created_at, 'Day') AS day, COUNT(*) AS count, COALESCE(SUM(total),0) AS total
		FROM orders
		GROUP BY TO_CHAR(created_at, 'Day'), EXTRACT(DOW FROM created_at)
		ORDER BY EXTRACT(DOW FROM created_at)
	`).Scan(&wd)
	stats.WeekdayDist = wd

	return &stats, nil
}

func (r *superadminRepository) GetAuditLogs(ctx context.Context, page, limit int, action, userID string) ([]models.AuditLog, int64, error) {
	query := r.db.WithContext(ctx).Model(&models.AuditLog{}).Order("created_at desc")
	if action != "" { query = query.Where("action = ?", action) }
	if userID != "" { query = query.Where("user_id = ?", userID) }
	var total int64; query.Count(&total)
	var list []models.AuditLog
	err := query.Offset((page-1)*limit).Limit(limit).Find(&list).Error
	return list, total, err
}

func (r *superadminRepository) GetPlatformSettings(ctx context.Context) (map[string]string, error) {
	var list []models.StoreSetting
	r.db.WithContext(ctx).Find(&list)
	m := make(map[string]string)
	for _, s := range list { m[s.Key] = s.Value }
	return m, nil
}

func (r *superadminRepository) UpsertPlatformSetting(ctx context.Context, key, value string) error {
	return r.db.WithContext(ctx).Where("key = ?", key).Assign(models.StoreSetting{Key: key, Value: value}).FirstOrCreate(&models.StoreSetting{}).Error
}

func (r *superadminRepository) GetContactMessages(ctx context.Context, page, limit int, status string) ([]models.ContactMessage, int64, error) {
	query := r.db.WithContext(ctx).Model(&models.ContactMessage{}).Order("created_at desc")
	if status == "unread" { query = query.Where("is_read = ?", false) }
	if status == "read" { query = query.Where("is_read = ?", true) }
	var total int64; query.Count(&total)
	var list []models.ContactMessage
	err := query.Offset((page-1)*limit).Limit(limit).Find(&list).Error
	return list, total, err
}

func (r *superadminRepository) MarkContactRead(ctx context.Context, id uint, userID uint) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&models.ContactMessage{}).Where("id = ?", id).Updates(map[string]interface{}{
		"is_read": true, "read_by_id": userID, "read_at": now,
	}).Error
}

func (r *superadminRepository) DeleteContactMessage(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.ContactMessage{}, id).Error
}

func (r *superadminRepository) CreateContactMessage(ctx context.Context, msg *models.ContactMessage) error {
	return r.db.WithContext(ctx).Create(msg).Error
}

func (r *superadminRepository) GetTickets(ctx context.Context, page, limit int, status string) ([]models.Ticket, int64, error) {
	query := r.db.WithContext(ctx).Model(&models.Ticket{}).Order("updated_at desc")
	if status != "" { query = query.Where("status = ?", status) }
	var total int64; query.Count(&total)
	var list []models.Ticket
	err := query.Offset((page - 1) * limit).Limit(limit).Find(&list).Error
	return list, total, err
}

func (r *superadminRepository) GetTicketByID(ctx context.Context, id uint) (*models.Ticket, error) {
	var t models.Ticket
	err := r.db.WithContext(ctx).Preload("Messages").First(&t, id).Error
	return &t, err
}

func (r *superadminRepository) GetMyTickets(ctx context.Context, userID, merchantID uint) ([]models.Ticket, error) {
	var list []models.Ticket
	query := r.db.WithContext(ctx).Where("email IN (SELECT email FROM users WHERE id = ?)", userID)
	if merchantID > 0 {
		query = r.db.WithContext(ctx).Where("merchant_id = ?", merchantID)
	}
	err := query.Order("updated_at desc").Find(&list).Error
	return list, err
}

func (r *superadminRepository) CreateTicket(ctx context.Context, t *models.Ticket) error {
	return r.db.WithContext(ctx).Create(t).Error
}

func (r *superadminRepository) AddTicketMessage(ctx context.Context, m *models.TicketMessage) error {
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *superadminRepository) UpdateTicketStatus(ctx context.Context, id uint, status string) error {
	return r.db.WithContext(ctx).Model(&models.Ticket{}).Where("id = ?", id).Update("status", status).Error
}

func (r *superadminRepository) GetDemographics(ctx context.Context) (*DemographicsData, error) {
	var d DemographicsData
	r.db.WithContext(ctx).Model(&models.Merchant{}).Where("active = ?", true).Count(&d.TotalMerchants)
	r.db.WithContext(ctx).Model(&models.Branch{}).Where("active = ?", true).Count(&d.TotalBranches)

	var cityDist []CityDist
	r.db.WithContext(ctx).Raw(`
		SELECT COALESCE(NULLIF(city,''), 'Unknown') AS city, COUNT(*) AS count,
		COUNT(DISTINCT merchant_id) AS merchants
		FROM branches WHERE active = true
		GROUP BY city ORDER BY count DESC
	`).Scan(&cityDist)
	d.CityDist = cityDist
	d.TotalCities = int64(len(cityDist))

	var branches []models.Branch
	r.db.WithContext(ctx).Preload("Merchant").Where("active = ?", true).Find(&branches)
	d.Branches = branches

	var recent []RecentMerchant
	r.db.WithContext(ctx).Raw(`
		SELECT m.id, m.name, m.code, COALESCE(b.city,'') AS city, m.created_at::text AS created_at
		FROM merchants m
		LEFT JOIN branches b ON b.merchant_id = m.id
		ORDER BY m.created_at DESC LIMIT 10
	`).Scan(&recent)
	d.RecentMerchants = recent

	return &d, nil
}

func (r *superadminRepository) GetExportData(ctx context.Context, dateFrom, dateTo string) (*ExportData, error) {
	var d ExportData
	d.GeneratedAt = time.Now().Format("2006-01-02 15:04:05")
	d.Period = dateFrom + " — " + dateTo

	// Merchants
	var me ExportMerchants
	r.db.WithContext(ctx).Model(&models.Merchant{}).Count(&me.Total)
	r.db.WithContext(ctx).Model(&models.MerchantSubscription{}).Where("status = ?", "active").Count(&me.Active)
	r.db.WithContext(ctx).Model(&models.MerchantSubscription{}).Where("status = ?", "trial").Count(&me.Trial)
	if dateFrom != "" {
		r.db.WithContext(ctx).Model(&models.Merchant{}).Where("created_at >= ?", dateFrom).Count(&me.New)
	} else {
		me.New = me.Total
	}
	d.Merchants = &me

	// Orders
	var ord ExportOrders
	q := r.db.WithContext(ctx).Model(&models.Order{})
	if dateFrom != "" { q = q.Where("created_at >= ?", dateFrom) }
	if dateTo != "" { q = q.Where("created_at <= ?", dateTo) }
	q.Count(&ord.Total)
	q.Where("payment_status = ?", "COMPLETED").Count(&ord.Completed)
	q.Select("COALESCE(SUM(total),0)").Scan(&ord.Revenue)
	d.Orders = &ord

	// Revenue
	var rev ExportRevenue
	r.db.WithContext(ctx).Model(&models.MerchantSubscription{}).Preload("Plan").Where("status IN ?", []string{"active", "trial"}).Find(&[]models.MerchantSubscription{})
	var activeSubs []models.MerchantSubscription
	r.db.WithContext(ctx).Preload("Plan").Where("status IN ?", []string{"active", "trial"}).Find(&activeSubs)
	for _, s := range activeSubs {
		if s.Plan != nil { rev.MRR += int64(s.Plan.PriceMonthly) }
	}
	rev.Total = ord.Revenue
	if me.Active > 0 { rev.PerMerchant = rev.Total / me.Active }
	d.Revenue = &rev

	// Top merchants
	var topM []TopMerchant
	r.db.WithContext(ctx).Raw(`SELECT m.id, m.name, m.code, COUNT(o.id) AS orders, COALESCE(SUM(o.total),0) AS total
		FROM merchants m LEFT JOIN orders o ON o.merchant_id = m.id GROUP BY m.id, m.name, m.code ORDER BY total DESC LIMIT 10`).Scan(&topM)
	d.TopMerchants = topM

	// Monthly data
	monthly, _ := r.GetMonthlyRevenue(ctx, 12)
	d.MonthlyData = monthly

	return &d, nil
}

func (r *superadminRepository) GetMonthlyRevenue(ctx context.Context, months int) ([]MonthlyRevenue, error) {
	var results []MonthlyRevenue
	now := time.Now()
	for i := months - 1; i >= 0; i-- {
		mStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location()).AddDate(0, -i, 0)
		mEnd := mStart.AddDate(0, 1, 0).Add(-time.Nanosecond)

		var rev int64
		r.db.WithContext(ctx).Model(&models.Order{}).Select("COALESCE(SUM(total),0)").Where("created_at >= ? AND created_at <= ?", mStart, mEnd).Scan(&rev)

		var newM int64
		r.db.WithContext(ctx).Model(&models.Merchant{}).Where("created_at >= ? AND created_at <= ?", mStart, mEnd).Count(&newM)

		var churned int64
		r.db.WithContext(ctx).Model(&models.MerchantSubscription{}).Where("status = ? AND updated_at >= ? AND updated_at <= ?", "expired", mStart, mEnd).Count(&churned)

		results = append(results, MonthlyRevenue{
			Month:        mStart.Format("2006-01"),
			Revenue:      rev,
			NewMerchants: newM,
			Churned:      churned,
		})
	}
	return results, nil
}

func (r *superadminRepository) GetAllOrders(ctx context.Context, page, limit int, merchantID uint, status, dateFrom, dateTo string) ([]models.Order, int64, error) {
	query := r.db.WithContext(ctx).Preload("Branch").Preload("OrderItems").Order("created_at desc")
	countQuery := r.db.WithContext(ctx).Model(&models.Order{})

	if merchantID > 0 {
		query = query.Where("merchant_id = ?", merchantID)
		countQuery = countQuery.Where("merchant_id = ?", merchantID)
	}
	if status != "" {
		query = query.Where("payment_status = ?", status)
		countQuery = countQuery.Where("payment_status = ?", status)
	}
	if dateFrom != "" {
		query = query.Where("created_at >= ?", dateFrom)
		countQuery = countQuery.Where("created_at >= ?", dateFrom)
	}
	if dateTo != "" {
		query = query.Where("created_at <= ?", dateTo)
		countQuery = countQuery.Where("created_at <= ?", dateTo)
	}

	var total int64
	countQuery.Count(&total)

	offset := (page - 1) * limit
	var list []models.Order
	err := query.Offset(offset).Limit(limit).Find(&list).Error
	return list, total, err
}

func (r *superadminRepository) GetRevenuePerMerchant(ctx context.Context, page, limit int) ([]MerchantRevenue, int64, error) {
	var total int64
	r.db.WithContext(ctx).Model(&models.Merchant{}).Count(&total)

	offset := (page - 1) * limit
	var merchants []models.Merchant
	if err := r.db.WithContext(ctx).Order("id asc").Offset(offset).Limit(limit).Find(&merchants).Error; err != nil {
		return nil, 0, err
	}

	var results []MerchantRevenue
	for _, m := range merchants {
		var sub models.MerchantSubscription
		var plan models.SubscriptionPlan
		subStatus := "none"
		planName := "-"
		monthlyFee := 0
		r.db.WithContext(ctx).Where("merchant_id = ?", m.ID).Last(&sub)
		if sub.ID > 0 {
			subStatus = sub.Status
			r.db.WithContext(ctx).First(&plan, sub.PlanID)
			if plan.ID > 0 {
				planName = plan.Name
				monthlyFee = plan.PriceMonthly
			}
		}

		var totalOrders int64
		r.db.WithContext(ctx).Model(&models.Order{}).Where("merchant_id = ?", m.ID).Count(&totalOrders)

		var totalRevenue int64
		r.db.WithContext(ctx).Model(&models.Order{}).Select("COALESCE(SUM(total),0)").Where("merchant_id = ?", m.ID).Scan(&totalRevenue)

		var lastPay *time.Time
		var pt models.PaymentTransaction
		if err := r.db.WithContext(ctx).Where("merchant_id = ? AND status = ?", m.ID, "paid").Order("paid_at desc").First(&pt).Error; err == nil {
			lastPay = pt.PaidAt
		}

		results = append(results, MerchantRevenue{
			MerchantID:         m.ID,
			Name:               m.Name,
			Code:               m.Code,
			Email:              m.Email,
			PlanName:           planName,
			SubscriptionStatus: subStatus,
			MonthlyFee:         monthlyFee,
			TotalOrders:        totalOrders,
			TotalRevenue:       totalRevenue,
			LastPayment:        lastPay,
			Active:             m.Active,
		})
	}
	return results, total, nil
}

func (r *superadminRepository) GetOrderStats(ctx context.Context) (*OrderStats, error) {
	var s OrderStats
	r.db.WithContext(ctx).Model(&models.Order{}).Count(&s.TotalOrders)
	r.db.WithContext(ctx).Model(&models.Order{}).Select("COALESCE(SUM(total),0)").Scan(&s.TotalRevenue)
	if s.TotalOrders > 0 {
		s.AvgOrderValue = s.TotalRevenue / s.TotalOrders
	}
	r.db.WithContext(ctx).Model(&models.Order{}).Where("payment_status = ?", "COMPLETED").Count(&s.Completed)
	r.db.WithContext(ctx).Model(&models.Order{}).Where("payment_status = ?", "PENDING").Count(&s.Pending)
	r.db.WithContext(ctx).Model(&models.Order{}).Where("payment_status = ?", "FAILED").Count(&s.Failed)
	r.db.WithContext(ctx).Model(&models.Order{}).Where("payment_status = ?", "REFUNDED").Count(&s.Refunded)
	todayStart := time.Date(time.Now().Year(), time.Now().Month(), time.Now().Day(), 0, 0, 0, 0, time.Now().Location())
	r.db.WithContext(ctx).Model(&models.Order{}).Where("created_at >= ?", todayStart).Count(&s.TodayOrders)
	r.db.WithContext(ctx).Model(&models.Order{}).Select("COALESCE(SUM(total),0)").Where("created_at >= ?", todayStart).Scan(&s.TodayRevenue)
	r.db.WithContext(ctx).Model(&models.Order{}).Select("COALESCE(SUM(total),0)").Where("payment_method = ?", "CASH").Scan(&s.CashAmount)
	r.db.WithContext(ctx).Model(&models.Order{}).Select("COALESCE(SUM(total),0)").Where("payment_method = ?", "TRANSFER").Scan(&s.TransferAmount)
	r.db.WithContext(ctx).Model(&models.Order{}).Select("COALESCE(SUM(total),0)").Where("payment_method IN ?", []string{"E_WALLET", "EWALLET"}).Scan(&s.EWalletAmount)
	r.db.WithContext(ctx).Model(&models.Order{}).Select("COALESCE(SUM(total),0)").Where("payment_method = ?", "CARD").Scan(&s.CardAmount)
	return &s, nil
}

func (r *superadminRepository) GetPaymentStats(ctx context.Context) (*PaymentStats, error) {
	var s PaymentStats
	r.db.WithContext(ctx).Model(&models.PaymentTransaction{}).Select("COALESCE(SUM(amount),0)").Where("status = ?", "paid").Scan(&s.TotalCollected)
	r.db.WithContext(ctx).Model(&models.PaymentTransaction{}).Select("COALESCE(SUM(amount),0)").Where("status = ?", "pending").Scan(&s.TotalPending)
	r.db.WithContext(ctx).Model(&models.PaymentTransaction{}).Select("COALESCE(SUM(amount),0)").Where("status = ?", "failed").Scan(&s.TotalFailed)
	r.db.WithContext(ctx).Model(&models.PaymentTransaction{}).Select("COALESCE(SUM(amount),0)").Where("status = ?", "refunded").Scan(&s.TotalRefunded)
	now := time.Now()
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	r.db.WithContext(ctx).Model(&models.PaymentTransaction{}).Select("COALESCE(SUM(amount),0)").Where("status = ? AND paid_at >= ?", "paid", monthStart).Scan(&s.ThisMonth)
	lastMonthStart := monthStart.AddDate(0, -1, 0)
	r.db.WithContext(ctx).Model(&models.PaymentTransaction{}).Select("COALESCE(SUM(amount),0)").Where("status = ? AND paid_at >= ? AND paid_at < ?", "paid", lastMonthStart, monthStart).Scan(&s.LastMonth)
	r.db.WithContext(ctx).Model(&models.PaymentTransaction{}).Where("status = ?", "paid").Count(&s.PaidCount)
	r.db.WithContext(ctx).Model(&models.PaymentTransaction{}).Where("status = ?", "pending").Count(&s.PendingCount)
	return &s, nil
}

func (r *superadminRepository) GetPaymentTransactions(ctx context.Context, page, limit int, status string) ([]models.PaymentTransaction, int64, error) {
	query := r.db.WithContext(ctx).Preload("Merchant").Preload("MerchantSubscription.Plan").Order("created_at desc")
	countQuery := r.db.WithContext(ctx).Model(&models.PaymentTransaction{})

	if status != "" {
		query = query.Where("status = ?", status)
		countQuery = countQuery.Where("status = ?", status)
	}

	var total int64
	countQuery.Count(&total)

	offset := (page - 1) * limit
	var list []models.PaymentTransaction
	err := query.Offset(offset).Limit(limit).Find(&list).Error
	return list, total, err
}

func (r *superadminRepository) GetSystemHealth(ctx context.Context) (*SystemHealth, error) {
	h := &SystemHealth{API: "healthy"}

	sqlDB, err := r.db.DB()
	if err != nil {
		h.Database = "unhealthy: " + err.Error()
		return h, nil
	}

	start := time.Now()
	if err := sqlDB.Ping(); err != nil {
		h.Database = "unhealthy: " + err.Error()
		return h, nil
	}
	h.DBLatency = time.Since(start).Round(time.Millisecond).String()
	h.Database = "healthy"

	r.db.WithContext(ctx).Model(&models.Merchant{}).Where("active = ?", true).Count(&h.ActiveMerchants)

	todayStart := time.Date(time.Now().Year(), time.Now().Month(), time.Now().Day(), 0, 0, 0, 0, time.Now().Location())
	r.db.WithContext(ctx).Model(&models.Order{}).Where("created_at >= ?", todayStart).Count(&h.TotalOrdersToday)

	var dbSize int64
	r.db.WithContext(ctx).Raw("SELECT pg_database_size(current_database())").Scan(&dbSize)
	if dbSize > 0 {
		sizeMB := float64(dbSize) / 1024 / 1024
		h.Storage = "healthy"
		if sizeMB > 1024 {
			h.Storage = "warning"
		}
	}

	return h, nil
}
