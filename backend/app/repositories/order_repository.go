package repositories

import (
	"context"
	"point-of-sale/backend/app/models"
	"strings"

	"gorm.io/gorm"
)

type OrderRepository interface {
	Create(ctx context.Context, order *models.Order) (*models.Order, error)
	GetAll(ctx context.Context) ([]models.Order, error)
	GetFiltered(ctx context.Context, query *models.OrderQuery, merchantID *uint) ([]models.Order, int64, error)
	GetByID(ctx context.Context, id uint) (*models.Order, error)
	GetByCustomerID(ctx context.Context, customerID uint, branchID *uint) ([]models.Order, error)
	Update(ctx context.Context, order *models.Order) error
}

type orderRepository struct {
	db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) OrderRepository {
	return &orderRepository{db: db}
}

func (r *orderRepository) Create(ctx context.Context, order *models.Order) (*models.Order, error) {
	err := r.db.WithContext(ctx).Create(order).Error
	return order, err
}

func (r *orderRepository) GetAll(ctx context.Context) ([]models.Order, error) {
	var orders []models.Order
	err := r.db.WithContext(ctx).Preload("OrderItems").Order("id desc").Find(&orders).Error
	return orders, err
}

func (r *orderRepository) GetByID(ctx context.Context, id uint) (*models.Order, error) {
	var order models.Order
	err := r.db.WithContext(ctx).Preload("OrderItems").First(&order, id).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &order, err
}

func (r *orderRepository) GetFiltered(ctx context.Context, query *models.OrderQuery, merchantID *uint) ([]models.Order, int64, error) {
	var orders []models.Order
	var total int64

	// Build base query
	db := r.db.WithContext(ctx).Model(&models.Order{})

	// Apply filters
	if query.Search != "" {
		search := "%" + strings.ToLower(query.Search) + "%"
		db = db.Where("LOWER(invoice_number) LIKE ? OR LOWER(customer) LIKE ?", search, search)
	}

	if query.PaymentMethod != "" {
		db = db.Where("payment_method = ?", query.PaymentMethod)
	}

	if query.Status != "" {
		db = db.Where("order_status = ?", query.Status)
	}

	if query.DateFrom != "" {
		db = db.Where("created_at >= ?", query.DateFrom)
	}

	if query.DateTo != "" {
		db = db.Where("created_at <= ?", query.DateTo+" 23:59:59")
	}

	if query.BranchID != nil {
		db = db.Where("branch_id = ?", *query.BranchID)
	}

	if merchantID != nil {
		db = db.Where("merchant_id = ?", *merchantID)
	}

	// Get total count before pagination
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply sorting (whitelist to prevent SQL injection)
	allowedSortBy := map[string]bool{"created_at": true, "total": true, "invoice_number": true, "customer": true, "payment_method": true, "order_status": true}
	sortBy := "created_at"
	if allowedSortBy[query.SortBy] {
		sortBy = query.SortBy
	}
	sortOrder := "desc"
	if query.SortOrder == "asc" {
		sortOrder = "asc"
	}
	db = db.Order(sortBy + " " + sortOrder)

	// Apply pagination
	page := query.Page
	if page < 1 {
		page = 1
	}
	limit := query.Limit
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	err := db.Preload("Branch").Preload("OrderItems").Preload("OrderItems.Product").
		Offset(offset).
		Limit(limit).
		Find(&orders).Error

	return orders, total, err
}

func (r *orderRepository) GetByCustomerID(ctx context.Context, customerID uint, branchID *uint) ([]models.Order, error) {
	var orders []models.Order
	db := r.db.WithContext(ctx).Preload("OrderItems").Where("customer_id = ?", customerID)
	if branchID != nil {
		db = db.Where("branch_id = ?", *branchID)
	}
	err := db.Order("created_at desc").Find(&orders).Error
	return orders, err
}

func (r *orderRepository) Update(ctx context.Context, order *models.Order) error {
	return r.db.WithContext(ctx).Save(order).Error
}
