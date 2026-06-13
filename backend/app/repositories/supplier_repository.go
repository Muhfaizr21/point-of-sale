package repositories

import (
	"context"
	"point-of-sale/backend/app/models"

	"gorm.io/gorm"
)

type SupplierRepository interface {
	GetAll(ctx context.Context) ([]models.Supplier, error)
	GetAllPaginated(ctx context.Context, page, limit int, search string) ([]models.Supplier, int64, error)
	GetByID(ctx context.Context, id uint) (*models.Supplier, error)
	Create(ctx context.Context, s *models.Supplier) (*models.Supplier, error)
	Update(ctx context.Context, s *models.Supplier) error
	Delete(ctx context.Context, id uint) error
}

type supplierRepository struct {
	db *gorm.DB
}

func NewSupplierRepository(db *gorm.DB) SupplierRepository {
	return &supplierRepository{db: db}
}

func (r *supplierRepository) GetAll(ctx context.Context) ([]models.Supplier, error) {
	var list []models.Supplier
	err := r.db.WithContext(ctx).Order("id desc").Find(&list).Error
	return list, err
}

func (r *supplierRepository) GetAllPaginated(ctx context.Context, page, limit int, search string) ([]models.Supplier, int64, error) {
	var total int64
	db := r.db.WithContext(ctx).Model(&models.Supplier{})
	if search != "" {
		db = db.Where("LOWER(name) LIKE ? OR LOWER(contact_person) LIKE ?", "%"+search+"%", "%"+search+"%")
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
	var list []models.Supplier
	err := db.Order("id desc").Offset(offset).Limit(limit).Find(&list).Error
	return list, total, err
}

func (r *supplierRepository) GetByID(ctx context.Context, id uint) (*models.Supplier, error) {
	var s models.Supplier
	err := r.db.WithContext(ctx).First(&s, id).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, models.NewAPIError(models.ErrNotFound, "Supplier not found", 404)
		}
		return nil, err
	}
	return &s, nil
}

func (r *supplierRepository) Create(ctx context.Context, s *models.Supplier) (*models.Supplier, error) {
	err := r.db.WithContext(ctx).Create(s).Error
	return s, err
}

func (r *supplierRepository) Update(ctx context.Context, s *models.Supplier) error {
	return r.db.WithContext(ctx).Save(s).Error
}

func (r *supplierRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.Supplier{}, id).Error
}
