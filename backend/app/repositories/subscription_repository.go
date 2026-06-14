package repositories

import (
	"context"
	"point-of-sale/backend/app/models"
	"gorm.io/gorm"
)

type SubscriptionRepository interface {
	GetAllPlans(ctx context.Context) ([]models.SubscriptionPlan, error)
	GetPlanByID(ctx context.Context, id uint) (*models.SubscriptionPlan, error)
	CreatePlan(ctx context.Context, p *models.SubscriptionPlan) (*models.SubscriptionPlan, error)
	UpdatePlan(ctx context.Context, p *models.SubscriptionPlan) error
	GetAllSubscriptions(ctx context.Context) ([]models.MerchantSubscription, error)
	GetSubscriptionByMerchant(ctx context.Context, merchantID uint) (*models.MerchantSubscription, error)
	CreateSubscription(ctx context.Context, s *models.MerchantSubscription) (*models.MerchantSubscription, error)
	UpdateSubscription(ctx context.Context, s *models.MerchantSubscription) error
}

type subscriptionRepository struct{ db *gorm.DB }

func NewSubscriptionRepository(db *gorm.DB) SubscriptionRepository {
	return &subscriptionRepository{db: db}
}

func (r *subscriptionRepository) GetAllPlans(ctx context.Context) ([]models.SubscriptionPlan, error) {
	var list []models.SubscriptionPlan
	err := r.db.WithContext(ctx).Order("price_monthly asc").Find(&list).Error
	return list, err
}

func (r *subscriptionRepository) GetPlanByID(ctx context.Context, id uint) (*models.SubscriptionPlan, error) {
	var p models.SubscriptionPlan
	err := r.db.WithContext(ctx).First(&p, id).Error
	if err != nil { return nil, err }
	return &p, nil
}

func (r *subscriptionRepository) CreatePlan(ctx context.Context, p *models.SubscriptionPlan) (*models.SubscriptionPlan, error) {
	err := r.db.WithContext(ctx).Create(p).Error
	return p, err
}

func (r *subscriptionRepository) UpdatePlan(ctx context.Context, p *models.SubscriptionPlan) error {
	return r.db.WithContext(ctx).Save(p).Error
}

func (r *subscriptionRepository) GetAllSubscriptions(ctx context.Context) ([]models.MerchantSubscription, error) {
	var list []models.MerchantSubscription
	err := r.db.WithContext(ctx).Preload("Plan").Preload("Merchant").Order("id desc").Find(&list).Error
	return list, err
}

func (r *subscriptionRepository) GetSubscriptionByMerchant(ctx context.Context, merchantID uint) (*models.MerchantSubscription, error) {
	var s models.MerchantSubscription
	err := r.db.WithContext(ctx).Preload("Plan").Where("merchant_id = ?", merchantID).First(&s).Error
	if err != nil { return nil, err }
	return &s, nil
}

func (r *subscriptionRepository) CreateSubscription(ctx context.Context, s *models.MerchantSubscription) (*models.MerchantSubscription, error) {
	err := r.db.WithContext(ctx).Create(s).Error
	return s, err
}

func (r *subscriptionRepository) UpdateSubscription(ctx context.Context, s *models.MerchantSubscription) error {
	return r.db.WithContext(ctx).Save(s).Error
}
