package repositories

import (
	"context"
	"point-of-sale/backend/app/models"

	"gorm.io/gorm"
)

type ProductRepository interface {
	GetAll(ctx context.Context, merchantID *uint) ([]models.Product, error)
	GetAllPaginated(ctx context.Context, page, limit int, search, category string, branchID *uint, merchantID *uint) ([]models.Product, int64, error)
	GetAllByBranch(ctx context.Context, branchID uint, merchantID *uint) ([]models.Product, error)
	GetByID(ctx context.Context, id uint) (*models.Product, error)
	Create(ctx context.Context, product *models.Product) (*models.Product, error)
	Update(ctx context.Context, product *models.Product) error
	Delete(ctx context.Context, id uint) error
	GetBySKU(ctx context.Context, sku string) (*models.Product, error)
	UpdateCategoryName(ctx context.Context, oldName, newName string) error
}

type productRepository struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) ProductRepository {
	return &productRepository{db: db}
}

func (r *productRepository) GetAll(ctx context.Context, merchantID *uint) ([]models.Product, error) {
	var products []models.Product
	db := r.db.WithContext(ctx)
	if merchantID != nil {
		db = db.Where("merchant_id = ?", *merchantID)
	}
	err := db.Order("id desc").Find(&products).Error
	return products, err
}

func (r *productRepository) GetAllByBranch(ctx context.Context, branchID uint, merchantID *uint) ([]models.Product, error) {
	var products []models.Product
	db := r.db.WithContext(ctx).Where("branch_id = ?", branchID)
	if merchantID != nil {
		db = db.Where("merchant_id = ?", *merchantID)
	}
	err := db.Order("id desc").Find(&products).Error
	return products, err
}

func (r *productRepository) GetAllPaginated(ctx context.Context, page, limit int, search, category string, branchID *uint, merchantID *uint) ([]models.Product, int64, error) {
	var total int64
	db := r.db.WithContext(ctx).Model(&models.Product{})
	if branchID != nil {
		db = db.Where("branch_id = ?", *branchID)
	}
	if merchantID != nil {
		db = db.Where("merchant_id = ?", *merchantID)
	}
	if search != "" {
		db = db.Where("LOWER(name) LIKE ? OR LOWER(sku) LIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if category != "" && category != "Semua" {
		db = db.Where("category = ?", category)
	}
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	offset := (page - 1) * limit
	var products []models.Product
	err := db.Order("id desc").Offset(offset).Limit(limit).Find(&products).Error
	return products, total, err
}

func (r *productRepository) GetByID(ctx context.Context, id uint) (*models.Product, error) {
	var product models.Product
	err := r.db.WithContext(ctx).First(&product, id).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, models.NewAPIError(models.ErrNotFound, "Product not found", 404)
		}
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) Create(ctx context.Context, product *models.Product) (*models.Product, error) {
	err := r.db.WithContext(ctx).Create(product).Error
	return product, err
}

func (r *productRepository) Update(ctx context.Context, product *models.Product) error {
	return r.db.WithContext(ctx).Save(product).Error
}

func (r *productRepository) Delete(ctx context.Context, id uint) error {
	err := r.db.WithContext(ctx).Delete(&models.Product{}, id).Error
	return err
}

func (r *productRepository) GetBySKU(ctx context.Context, sku string) (*models.Product, error) {
	var product models.Product
	err := r.db.WithContext(ctx).Where("sku = ?", sku).First(&product).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) UpdateCategoryName(ctx context.Context, oldName, newName string) error {
	return r.db.WithContext(ctx).Model(&models.Product{}).Where("category = ?", oldName).Update("category", newName).Error
}
