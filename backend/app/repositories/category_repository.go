package repositories

import (
	"context"
	"point-of-sale/backend/app/models"
	"gorm.io/gorm"
)

type CategoryRepository interface {
	GetAll(ctx context.Context, branchID *uint, merchantID *uint) ([]models.Category, error)
	GetByID(ctx context.Context, id uint) (*models.Category, error)
	Create(ctx context.Context, category *models.Category) error
	Update(ctx context.Context, category *models.Category) error
	Delete(ctx context.Context, id uint) error
}

type categoryRepository struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) CategoryRepository {
	return &categoryRepository{db: db}
}

func (r *categoryRepository) GetAll(ctx context.Context, branchID *uint, merchantID *uint) ([]models.Category, error) {
	var categories []models.Category
	db := r.db.WithContext(ctx)
	if branchID != nil {
		db = db.Where("branch_id = ?", *branchID)
	}
	if merchantID != nil {
		db = db.Where("merchant_id = ?", *merchantID)
	}
	err := db.Order("id asc").Find(&categories).Error
	return categories, err
}

func (r *categoryRepository) GetByID(ctx context.Context, id uint) (*models.Category, error) {
	var category models.Category
	err := r.db.WithContext(ctx).First(&category, id).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, models.NewAPIError(models.ErrNotFound, "Category not found", 404)
		}
		return nil, err
	}
	return &category, nil
}

func (r *categoryRepository) Create(ctx context.Context, category *models.Category) error {
	return r.db.WithContext(ctx).Create(category).Error
}

func (r *categoryRepository) Update(ctx context.Context, category *models.Category) error {
	return r.db.WithContext(ctx).Save(category).Error
}

func (r *categoryRepository) Delete(ctx context.Context, id uint) error {
	result := r.db.WithContext(ctx).Delete(&models.Category{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return models.NewAPIError(models.ErrNotFound, "Category not found", 404)
	}
	return nil
}
