package repositories

import (
	"context"
	"point-of-sale/backend/app/models"

	"gorm.io/gorm"
)

type BranchRepository interface {
	GetAll(ctx context.Context, merchantID *uint) ([]models.Branch, error)
	GetByID(ctx context.Context, id uint) (*models.Branch, error)
	Create(ctx context.Context, b *models.Branch) (*models.Branch, error)
	Update(ctx context.Context, b *models.Branch) error
	Delete(ctx context.Context, id uint) error
}

type branchRepository struct {
	db *gorm.DB
}

func NewBranchRepository(db *gorm.DB) BranchRepository {
	return &branchRepository{db: db}
}

func (r *branchRepository) GetAll(ctx context.Context, merchantID *uint) ([]models.Branch, error) {
	var list []models.Branch
	db := r.db.WithContext(ctx)
	if merchantID != nil {
		db = db.Where("merchant_id = ?", *merchantID)
	}
	err := db.Order("id asc").Find(&list).Error
	return list, err
}

func (r *branchRepository) GetByID(ctx context.Context, id uint) (*models.Branch, error) {
	var b models.Branch
	err := r.db.WithContext(ctx).First(&b, id).Error
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *branchRepository) Create(ctx context.Context, b *models.Branch) (*models.Branch, error) {
	err := r.db.WithContext(ctx).Create(b).Error
	return b, err
}

func (r *branchRepository) Update(ctx context.Context, b *models.Branch) error {
	return r.db.WithContext(ctx).Save(b).Error
}

func (r *branchRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.Branch{}, id).Error
}
