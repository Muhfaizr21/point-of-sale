package repositories

import (
	"context"
	"point-of-sale/backend/app/models"

	"gorm.io/gorm"
)

type StockLogRepository interface {
	GetByProductID(ctx context.Context, productID uint) ([]models.StockLog, error)
	Create(ctx context.Context, log *models.StockLog) error
}

type stockLogRepository struct {
	db *gorm.DB
}

func NewStockLogRepository(db *gorm.DB) StockLogRepository {
	return &stockLogRepository{db: db}
}

func (r *stockLogRepository) GetByProductID(ctx context.Context, productID uint) ([]models.StockLog, error) {
	var logs []models.StockLog
	err := r.db.WithContext(ctx).Preload("Product").Where("product_id = ?", productID).Order("created_at desc").Find(&logs).Error
	return logs, err
}

func (r *stockLogRepository) Create(ctx context.Context, log *models.StockLog) error {
	return r.db.WithContext(ctx).Create(log).Error
}
