package repositories

import (
	"context"
	"point-of-sale/backend/app/models"

	"gorm.io/gorm"
)

type BundleRepository interface {
	GetAll(ctx context.Context, branchID *uint, merchantID *uint) ([]models.Bundle, error)
	GetByID(ctx context.Context, id uint) (*models.Bundle, error)
	Create(ctx context.Context, bundle *models.Bundle) (*models.Bundle, error)
	Update(ctx context.Context, bundle *models.Bundle) error
	Delete(ctx context.Context, id uint) error
}

type bundleRepository struct {
	db *gorm.DB
}

func NewBundleRepository(db *gorm.DB) BundleRepository {
	return &bundleRepository{db: db}
}

func (r *bundleRepository) GetAll(ctx context.Context, branchID *uint, merchantID *uint) ([]models.Bundle, error) {
	var bundles []models.Bundle
	db := r.db.WithContext(ctx)
	if branchID != nil {
		db = db.Where("branch_id = ?", *branchID)
	}
	if merchantID != nil {
		db = db.Where("merchant_id = ?", *merchantID)
	}
	err := db.Preload("Items.Product").Order("id desc").Find(&bundles).Error
	return bundles, err
}

func (r *bundleRepository) GetByID(ctx context.Context, id uint) (*models.Bundle, error) {
	var bundle models.Bundle
	err := r.db.WithContext(ctx).Preload("Items.Product").First(&bundle, id).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, models.NewAPIError(models.ErrNotFound, "Bundle not found", 404)
		}
		return nil, err
	}
	return &bundle, nil
}

func (r *bundleRepository) Create(ctx context.Context, bundle *models.Bundle) (*models.Bundle, error) {
	err := r.db.WithContext(ctx).Create(bundle).Error
	return bundle, err
}

func (r *bundleRepository) Update(ctx context.Context, bundle *models.Bundle) error {
	return r.db.WithContext(ctx).Save(bundle).Error
}

func (r *bundleRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.Bundle{}, id).Error
}
