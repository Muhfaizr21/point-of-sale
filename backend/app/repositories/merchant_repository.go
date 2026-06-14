package repositories

import (
	"context"
	"point-of-sale/backend/app/models"
	"gorm.io/gorm"
)

type MerchantRepository interface {
	GetAll(ctx context.Context) ([]models.Merchant, error)
	GetByID(ctx context.Context, id uint) (*models.Merchant, error)
	Create(ctx context.Context, m *models.Merchant) (*models.Merchant, error)
	Update(ctx context.Context, m *models.Merchant) error
}

type merchantRepository struct{ db *gorm.DB }

func NewMerchantRepository(db *gorm.DB) MerchantRepository {
	return &merchantRepository{db: db}
}

func (r *merchantRepository) GetAll(ctx context.Context) ([]models.Merchant, error) {
	var list []models.Merchant
	err := r.db.WithContext(ctx).Order("id asc").Find(&list).Error
	return list, err
}

func (r *merchantRepository) GetByID(ctx context.Context, id uint) (*models.Merchant, error) {
	var m models.Merchant
	err := r.db.WithContext(ctx).First(&m, id).Error
	if err != nil { return nil, err }
	return &m, nil
}

func (r *merchantRepository) Create(ctx context.Context, m *models.Merchant) (*models.Merchant, error) {
	err := r.db.WithContext(ctx).Create(m).Error
	return m, err
}

func (r *merchantRepository) Update(ctx context.Context, m *models.Merchant) error {
	return r.db.WithContext(ctx).Save(m).Error
}
