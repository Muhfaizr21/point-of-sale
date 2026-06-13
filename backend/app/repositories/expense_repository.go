package repositories

import (
	"context"
	"point-of-sale/backend/app/models"
	"strings"

	"gorm.io/gorm"
)

type ExpenseRepository interface {
	GetFiltered(ctx context.Context, query *models.ExpenseQuery) ([]models.Expense, int64, error)
	GetByID(ctx context.Context, id uint) (*models.Expense, error)
	Create(ctx context.Context, e *models.Expense) (*models.Expense, error)
	Update(ctx context.Context, e *models.Expense) error
	Delete(ctx context.Context, id uint) error
}

type expenseRepository struct {
	db *gorm.DB
}

func NewExpenseRepository(db *gorm.DB) ExpenseRepository {
	return &expenseRepository{db: db}
}

func (r *expenseRepository) GetFiltered(ctx context.Context, query *models.ExpenseQuery) ([]models.Expense, int64, error) {
	var list []models.Expense
	var total int64

	db := r.db.WithContext(ctx).Model(&models.Expense{})

	if query.DateFrom != "" {
		db = db.Where("date >= ?", query.DateFrom)
	}
	if query.DateTo != "" {
		db = db.Where("date <= ?", query.DateTo)
	}
	if query.Category != "" {
		db = db.Where("category = ?", query.Category)
	} else {
		db = db.Where("category != ?", "Modal")
	}
	if query.Search != "" {
		search := "%" + strings.ToLower(query.Search) + "%"
		db = db.Where("LOWER(description) LIKE ? OR LOWER(notes) LIKE ?", search, search)
	}

	if query.BranchID != nil {
		db = db.Where("branch_id = ?", *query.BranchID)
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	allowedSortBy := map[string]bool{"date": true, "amount": true, "description": true, "category": true}
	sortBy := "date"
	if allowedSortBy[query.SortBy] {
		sortBy = query.SortBy
	}
	sortOrder := "desc"
	if query.SortOrder == "asc" {
		sortOrder = "asc"
	}
	db = db.Order(sortBy + " " + sortOrder).Order("id desc")

	page := query.Page
	if page < 1 {
		page = 1
	}
	limit := query.Limit
	if limit < 1 {
		limit = 20
	}
	offset := (page - 1) * limit

	err := db.Preload("Branch").Offset(offset).Limit(limit).Find(&list).Error
	return list, total, err
}

func (r *expenseRepository) GetByID(ctx context.Context, id uint) (*models.Expense, error) {
	var e models.Expense
	err := r.db.WithContext(ctx).First(&e, id).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, models.NewAPIError(models.ErrNotFound, "Expense not found", 404)
		}
		return nil, err
	}
	return &e, nil
}

func (r *expenseRepository) Create(ctx context.Context, e *models.Expense) (*models.Expense, error) {
	err := r.db.WithContext(ctx).Create(e).Error
	return e, err
}

func (r *expenseRepository) Update(ctx context.Context, e *models.Expense) error {
	return r.db.WithContext(ctx).Save(e).Error
}

func (r *expenseRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.Expense{}, id).Error
}
