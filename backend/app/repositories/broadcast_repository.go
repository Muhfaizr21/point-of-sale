package repositories

import (
	"context"
	"point-of-sale/backend/app/models"
	"gorm.io/gorm"
)

type BroadcastRepository interface {
	Create(ctx context.Context, b *models.Broadcast) (*models.Broadcast, error)
	GetAll(ctx context.Context, page, limit int) ([]models.Broadcast, int64, error)
	GetByID(ctx context.Context, id uint) (*models.Broadcast, error)
	Delete(ctx context.Context, id uint) error
	GetUnreadByMerchant(ctx context.Context, merchantID uint) ([]models.Broadcast, error)
	MarkRead(ctx context.Context, broadcastID, merchantID uint) error
}

type broadcastRepository struct{ db *gorm.DB }

func NewBroadcastRepository(db *gorm.DB) BroadcastRepository {
	return &broadcastRepository{db: db}
}

func (r *broadcastRepository) Create(ctx context.Context, b *models.Broadcast) (*models.Broadcast, error) {
	err := r.db.WithContext(ctx).Create(b).Error
	return b, err
}

func (r *broadcastRepository) GetAll(ctx context.Context, page, limit int) ([]models.Broadcast, int64, error) {
	var total int64
	if err := r.db.WithContext(ctx).Model(&models.Broadcast{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var list []models.Broadcast
	offset := (page - 1) * limit
	err := r.db.WithContext(ctx).Order("created_at desc").Offset(offset).Limit(limit).Find(&list).Error
	return list, total, err
}

func (r *broadcastRepository) GetByID(ctx context.Context, id uint) (*models.Broadcast, error) {
	var b models.Broadcast
	err := r.db.WithContext(ctx).First(&b, id).Error
	return &b, err
}

func (r *broadcastRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.Broadcast{}, id).Error
}

func (r *broadcastRepository) GetUnreadByMerchant(ctx context.Context, merchantID uint) ([]models.Broadcast, error) {
	var readIDs []uint
	if err := r.db.WithContext(ctx).Model(&models.BroadcastRead{}).
		Where("merchant_id = ?", merchantID).
		Pluck("broadcast_id", &readIDs).Error; err != nil {
		return nil, err
	}

	query := r.db.WithContext(ctx).
		Where("type = 'general' OR type = 'merchant'").
		Order("created_at desc")

	if len(readIDs) > 0 {
		query = query.Where("id NOT IN ?", readIDs)
	}

	var list []models.Broadcast
	if err := query.Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *broadcastRepository) MarkRead(ctx context.Context, broadcastID, merchantID uint) error {
	return r.db.WithContext(ctx).Create(&models.BroadcastRead{
		BroadcastID: broadcastID,
		MerchantID:  merchantID,
	}).Error
}
