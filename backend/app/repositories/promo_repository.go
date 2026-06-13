package repositories

import (
	"context"
	"point-of-sale/backend/app/models"

	"gorm.io/gorm"
)

type PromoRepository interface {
	GetAll(ctx context.Context, branchID *uint) ([]models.Promo, error)
	GetByID(ctx context.Context, id uint) (*models.Promo, error)
	Create(ctx context.Context, promo *models.Promo) (*models.Promo, error)
	Update(ctx context.Context, promo *models.Promo) error
	Delete(ctx context.Context, id uint) error
	GetActivePromos(ctx context.Context, branchID *uint) ([]models.Promo, error)
}

type promoRepository struct {
	db *gorm.DB
}

func NewPromoRepository(db *gorm.DB) PromoRepository {
	return &promoRepository{db: db}
}

func (r *promoRepository) GetAll(ctx context.Context, branchID *uint) ([]models.Promo, error) {
	var promos []models.Promo
	db := r.db.WithContext(ctx)
	if branchID != nil {
		db = db.Where("branch_id = ?", *branchID)
	}
	err := db.Order("id desc").Find(&promos).Error
	return promos, err
}

func (r *promoRepository) GetByID(ctx context.Context, id uint) (*models.Promo, error) {
	var promo models.Promo
	err := r.db.WithContext(ctx).First(&promo, id).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, models.NewAPIError(models.ErrNotFound, "Promo not found", 404)
		}
		return nil, err
	}
	return &promo, nil
}

func (r *promoRepository) Create(ctx context.Context, promo *models.Promo) (*models.Promo, error) {
	err := r.db.WithContext(ctx).Create(promo).Error
	return promo, err
}

func (r *promoRepository) Update(ctx context.Context, promo *models.Promo) error {
	return r.db.WithContext(ctx).Save(promo).Error
}

func (r *promoRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.Promo{}, id).Error
}

func (r *promoRepository) GetActivePromos(ctx context.Context, branchID *uint) ([]models.Promo, error) {
	var promos []models.Promo
	db := r.db.WithContext(ctx).Where("active = ?", true)
	if branchID != nil {
		db = db.Where("branch_id = ?", *branchID)
	}
	err := db.Order("id desc").Find(&promos).Error
	return promos, err
}
