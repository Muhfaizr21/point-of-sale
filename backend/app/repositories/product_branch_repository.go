package repositories

import (
	"context"
	"point-of-sale/backend/app/models"

	"gorm.io/gorm"
)

type ProductBranchRepository interface {
	GetByBranchProduct(ctx context.Context, branchID, productID uint) (*models.ProductBranch, error)
	GetByBranch(ctx context.Context, branchID uint) ([]models.ProductBranch, error)
	Upsert(ctx context.Context, pb *models.ProductBranch) error
	Delete(ctx context.Context, branchID, productID uint) error
	GetDB() *gorm.DB
}

type productBranchRepository struct {
	db *gorm.DB
}

func NewProductBranchRepository(db *gorm.DB) ProductBranchRepository {
	return &productBranchRepository{db: db}
}

func (r *productBranchRepository) GetByBranchProduct(ctx context.Context, branchID, productID uint) (*models.ProductBranch, error) {
	var pb models.ProductBranch
	err := r.db.WithContext(ctx).Where("branch_id = ? AND product_id = ?", branchID, productID).First(&pb).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &pb, nil
}

func (r *productBranchRepository) GetByBranch(ctx context.Context, branchID uint) ([]models.ProductBranch, error) {
	var list []models.ProductBranch
	err := r.db.WithContext(ctx).Where("branch_id = ?", branchID).Find(&list).Error
	return list, err
}

func (r *productBranchRepository) Upsert(ctx context.Context, pb *models.ProductBranch) error {
	var existing models.ProductBranch
	err := r.db.WithContext(ctx).Where("branch_id = ? AND product_id = ?", pb.BranchID, pb.ProductID).First(&existing).Error
	if err == gorm.ErrRecordNotFound {
		return r.db.WithContext(ctx).Create(pb).Error
	}
	if err != nil {
		return err
	}
	pb.ID = existing.ID
	return r.db.WithContext(ctx).Save(pb).Error
}

func (r *productBranchRepository) Delete(ctx context.Context, branchID, productID uint) error {
	return r.db.WithContext(ctx).Where("branch_id = ? AND product_id = ?", branchID, productID).
		Delete(&models.ProductBranch{}).Error
}

func (r *productBranchRepository) GetDB() *gorm.DB {
	return r.db
}
