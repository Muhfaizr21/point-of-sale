package repositories

import (
	"context"
	"errors"
	"point-of-sale/backend/app/models"
	"gorm.io/gorm"
)

type IntegrationRepository interface {
	GetAll(ctx context.Context) ([]models.MerchantIntegration, error)
	GetByMerchant(ctx context.Context, merchantID uint) ([]models.MerchantIntegration, error)
	GetByMerchantAndApp(ctx context.Context, merchantID uint, app string) (*models.MerchantIntegration, error)
	Upsert(ctx context.Context, i *models.MerchantIntegration) error
}

type integrationRepository struct{ db *gorm.DB }

func NewIntegrationRepository(db *gorm.DB) IntegrationRepository {
	return &integrationRepository{db: db}
}

func (r *integrationRepository) GetAll(ctx context.Context) ([]models.MerchantIntegration, error) {
	var list []models.MerchantIntegration
	err := r.db.WithContext(ctx).Preload("Merchant").Order("merchant_id, app").Find(&list).Error
	return list, err
}

func (r *integrationRepository) GetByMerchant(ctx context.Context, merchantID uint) ([]models.MerchantIntegration, error) {
	var list []models.MerchantIntegration
	err := r.db.WithContext(ctx).Where("merchant_id = ?", merchantID).Find(&list).Error
	return list, err
}

func (r *integrationRepository) GetByMerchantAndApp(ctx context.Context, merchantID uint, app string) (*models.MerchantIntegration, error) {
	var i models.MerchantIntegration
	err := r.db.WithContext(ctx).Where("merchant_id = ? AND app = ?", merchantID, app).First(&i).Error
	if err != nil {
		return nil, err
	}
	return &i, nil
}

func (r *integrationRepository) Upsert(ctx context.Context, i *models.MerchantIntegration) error {
	var existing models.MerchantIntegration
	result := r.db.WithContext(ctx).Where("merchant_id = ? AND app = ?", i.MerchantID, i.App).First(&existing)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return r.db.WithContext(ctx).Create(i).Error
		}
		return result.Error
	}
	i.ID = existing.ID
	i.CreatedAt = existing.CreatedAt
	return r.db.WithContext(ctx).Model(&existing).Updates(map[string]interface{}{
		"enabled": i.Enabled,
		"config":  i.Config,
	}).Error
}
