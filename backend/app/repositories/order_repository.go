package repositories

import (
	"context"
	"point-of-sale/backend/app/models"

	"gorm.io/gorm"
)

type OrderRepository interface {
	Create(ctx context.Context, order *models.Order) (*models.Order, error)
	GetAll(ctx context.Context) ([]models.Order, error)
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
