package repositories

import (
	"context"
	"point-of-sale/backend/app/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type TargetRepository interface {
	GetAll(ctx context.Context, branchID *uint, merchantID *uint) ([]models.DailyTarget, error)
	GetByDate(ctx context.Context, date string, branchID *uint, merchantID *uint) (*models.DailyTarget, error)
	Upsert(ctx context.Context, target *models.DailyTarget) error
	Delete(ctx context.Context, date string, branchID *uint) error
}

type targetRepository struct {
	db *gorm.DB
}

func NewTargetRepository(db *gorm.DB) TargetRepository {
	return &targetRepository{db: db}
}

func (r *targetRepository) GetAll(ctx context.Context, branchID *uint, merchantID *uint) ([]models.DailyTarget, error) {
	var targets []models.DailyTarget
	db := r.db.WithContext(ctx).Order("date desc")
	if branchID != nil {
		db = db.Where("branch_id = ?", *branchID)
	}
	if merchantID != nil {
		db = db.Where("merchant_id = ?", *merchantID)
	}
	err := db.Find(&targets).Error
	return targets, err
}

func (r *targetRepository) GetByDate(ctx context.Context, date string, branchID *uint, merchantID *uint) (*models.DailyTarget, error) {
	var target models.DailyTarget
	db := r.db.WithContext(ctx).Where("date = ?", date)
	if branchID != nil {
		db = db.Where("branch_id = ?", *branchID)
	}
	if merchantID != nil {
		db = db.Where("merchant_id = ?", *merchantID)
	}
	err := db.First(&target).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &target, nil
}

func (r *targetRepository) Upsert(ctx context.Context, target *models.DailyTarget) error {
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "date"}, {Name: "branch_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"revenue_target", "transaction_target", "updated_at"}),
	}).Create(target).Error
}

func (r *targetRepository) Delete(ctx context.Context, date string, branchID *uint) error {
	db := r.db.WithContext(ctx).Where("date = ?", date)
	if branchID != nil {
		db = db.Where("branch_id = ?", *branchID)
	}
	result := db.Delete(&models.DailyTarget{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return models.NewAPIError(models.ErrNotFound, "Target tidak ditemukan", 404)
	}
	return nil
}
