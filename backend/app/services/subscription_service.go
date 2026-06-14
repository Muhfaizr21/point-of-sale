package services

import (
	"context"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/repositories"
	"strings"
	"time"
)

type SubscriptionService interface {
	GetAllPlans(ctx context.Context) ([]models.SubscriptionPlan, error)
	CreatePlan(ctx context.Context, req *models.CreatePlanRequest) (*models.SubscriptionPlan, error)
	UpdatePlan(ctx context.Context, id uint, req *models.CreatePlanRequest) (*models.SubscriptionPlan, error)
	GetAllSubscriptions(ctx context.Context) ([]models.MerchantSubscription, error)
	GetSubscriptionByMerchant(ctx context.Context, merchantID uint) (*models.MerchantSubscription, error)
	AssignSubscription(ctx context.Context, req *models.AssignSubscriptionRequest) (*models.MerchantSubscription, error)
}

type subscriptionService struct {
	repo repositories.SubscriptionRepository
}

func NewSubscriptionService(repo repositories.SubscriptionRepository) SubscriptionService {
	return &subscriptionService{repo: repo}
}

func (s *subscriptionService) GetAllPlans(ctx context.Context) ([]models.SubscriptionPlan, error) {
	return s.repo.GetAllPlans(ctx)
}

func (s *subscriptionService) CreatePlan(ctx context.Context, req *models.CreatePlanRequest) (*models.SubscriptionPlan, error) {
	if strings.TrimSpace(req.Name) == "" {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Nama paket wajib diisi", 400)
	}
	if strings.TrimSpace(req.Code) == "" {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Kode paket wajib diisi", 400)
	}
	p := &models.SubscriptionPlan{
		Name: req.Name, Code: strings.ToUpper(strings.TrimSpace(req.Code)),
		PriceMonthly: req.PriceMonthly, PriceYearly: req.PriceYearly,
		MaxBranches: req.MaxBranches, MaxUsers: req.MaxUsers,
		Features: req.Features, Active: true,
	}
	return s.repo.CreatePlan(ctx, p)
}

func (s *subscriptionService) UpdatePlan(ctx context.Context, id uint, req *models.CreatePlanRequest) (*models.SubscriptionPlan, error) {
	p, err := s.repo.GetPlanByID(ctx, id)
	if err != nil {
		return nil, models.NewAPIError(models.ErrNotFound, "Paket tidak ditemukan", 404)
	}
	if req.Name != "" { p.Name = req.Name }
	if req.Code != "" { p.Code = strings.ToUpper(strings.TrimSpace(req.Code)) }
	if req.PriceMonthly > 0 { p.PriceMonthly = req.PriceMonthly }
	if req.PriceYearly > 0 { p.PriceYearly = req.PriceYearly }
	if req.MaxBranches > 0 { p.MaxBranches = req.MaxBranches }
	if req.MaxUsers > 0 { p.MaxUsers = req.MaxUsers }
	if req.Features != nil { p.Features = req.Features }
	return p, s.repo.UpdatePlan(ctx, p)
}

func (s *subscriptionService) GetAllSubscriptions(ctx context.Context) ([]models.MerchantSubscription, error) {
	return s.repo.GetAllSubscriptions(ctx)
}

func (s *subscriptionService) GetSubscriptionByMerchant(ctx context.Context, merchantID uint) (*models.MerchantSubscription, error) {
	return s.repo.GetSubscriptionByMerchant(ctx, merchantID)
}

func (s *subscriptionService) AssignSubscription(ctx context.Context, req *models.AssignSubscriptionRequest) (*models.MerchantSubscription, error) {
	if req.MerchantID == 0 || req.PlanID == 0 {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Merchant dan paket harus dipilih", 400)
	}
	plan, err := s.repo.GetPlanByID(ctx, req.PlanID)
	if err != nil {
		return nil, models.NewAPIError(models.ErrNotFound, "Paket tidak ditemukan", 404)
	}
	period := req.BillingPeriod
	if period != "monthly" && period != "yearly" {
		period = "monthly"
	}
	now := time.Now()
	endDate := now.AddDate(0, 1, 0)
	if period == "yearly" {
		endDate = now.AddDate(1, 0, 0)
	}
	price := plan.PriceMonthly
	if period == "yearly" { price = plan.PriceYearly }

	// Check if merchant already has subscription
	existing, err := s.repo.GetSubscriptionByMerchant(ctx, req.MerchantID)
	if err == nil && existing != nil {
		// Update existing
		existing.PlanID = req.PlanID
		existing.BillingPeriod = period
		existing.Status = "active"
		existing.EndDate = endDate
		existing.AutoRenew = true
		return existing, s.repo.UpdateSubscription(ctx, existing)
	}

	sub := &models.MerchantSubscription{
		MerchantID:    req.MerchantID,
		PlanID:        req.PlanID,
		BillingPeriod: period,
		Status:        "active",
		StartDate:     now,
		EndDate:       endDate,
		AutoRenew:     true,
	}
	_ = price // for future invoice generation
	return s.repo.CreateSubscription(ctx, sub)
}
