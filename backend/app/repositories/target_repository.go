package repositories

import (
	"context"
	"point-of-sale/backend/app/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type TargetRepository interface {
	GetAll(ctx context.Context) ([]models.DailyTarget, error)
	GetByDate(ctx context.Context, date string) (*models.DailyTarget, error)
	Upsert(ctx context.Context, target *models.DailyTarget) error
	Delete(ctx context.Context, date string) error
}

type targetRepository struct {
	db *gorm.DB
}

func NewTargetRepository(db *gorm.DB) TargetRepository {
	return &targetRepository{db: db}
}

func (r *targetRepository) GetAll(ctx context.Context) ([]models.DailyTarget, error) {
	var targets []models.DailyTarget
	err := r.db.WithContext(ctx).Order("date desc").Find(&targets).Error
	return targets, err
}

func (r *targetRepository) GetByDate(ctx context.Context, date string) (*models.DailyTarget, error) {
	var target models.DailyTarget
	err := r.db.WithContext(ctx).Where("date = ?", date).First(&target).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil // Return nil, nil when not found to easily handle default fallback
		}
		return nil, err
	}
	return &target, nil
}

func (r *targetRepository) Upsert(ctx context.Context, target *models.DailyTarget) error {
	// GORM Clause OnConflict allows upserting by unique index `date`
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "date"}},
		DoUpdates: clause.AssignmentColumns([]string{"revenue_target", "transaction_target", "updated_at"}),
	}).Create(target).Error
}

func (r *targetRepository) Delete(ctx context.Context, date string) error {
	result := r.db.WithContext(ctx).Where("date = ?", date).Delete(&models.DailyTarget{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return models.NewAPIError(models.ErrNotFound, "Target tidak ditemukan untuk tanggal tersebut", 404)
	}
	return nil
}
