package repositories

import (
	"context"
	"point-of-sale/backend/app/models"

	"gorm.io/gorm"
)

type CustomerRepository interface {
	GetAll(ctx context.Context) ([]models.Customer, error)
	GetAllPaginated(ctx context.Context, page, limit int, search string) ([]models.Customer, int64, error)
	GetByID(ctx context.Context, id uint) (*models.Customer, error)
	Create(ctx context.Context, c *models.Customer) (*models.Customer, error)
	Update(ctx context.Context, c *models.Customer) error
	Delete(ctx context.Context, id uint) error
	IncrementSpent(ctx context.Context, id uint, amount int) error
}

type customerRepository struct {
	db *gorm.DB
}

func NewCustomerRepository(db *gorm.DB) CustomerRepository {
	return &customerRepository{db: db}
}

func (r *customerRepository) GetAll(ctx context.Context) ([]models.Customer, error) {
	var list []models.Customer
	err := r.db.WithContext(ctx).Order("id desc").Find(&list).Error
	return list, err
}

func (r *customerRepository) GetAllPaginated(ctx context.Context, page, limit int, search string) ([]models.Customer, int64, error) {
	var total int64
	db := r.db.WithContext(ctx).Model(&models.Customer{})
	if search != "" {
		db = db.Where("LOWER(name) LIKE ? OR LOWER(phone) LIKE ?", "%"+search+"%", "%"+search+"%")
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
	var list []models.Customer
	err := db.Order("id desc").Offset(offset).Limit(limit).Find(&list).Error
	return list, total, err
}

func (r *customerRepository) GetByID(ctx context.Context, id uint) (*models.Customer, error) {
	var c models.Customer
	err := r.db.WithContext(ctx).First(&c, id).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, models.NewAPIError(models.ErrNotFound, "Customer not found", 404)
		}
		return nil, err
	}
	return &c, nil
}

func (r *customerRepository) Create(ctx context.Context, c *models.Customer) (*models.Customer, error) {
	err := r.db.WithContext(ctx).Create(c).Error
	return c, err
}

func (r *customerRepository) Update(ctx context.Context, c *models.Customer) error {
	return r.db.WithContext(ctx).Save(c).Error
}

func (r *customerRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.Customer{}, id).Error
}

func (r *customerRepository) IncrementSpent(ctx context.Context, id uint, amount int) error {
	return r.db.WithContext(ctx).Model(&models.Customer{}).Where("id = ?", id).
		UpdateColumn("total_spent", gorm.Expr("total_spent + ?", amount)).Error
}
