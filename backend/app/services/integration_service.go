package services

import (
	"context"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/repositories"
)

type IntegrationService interface {
	GetAll(ctx context.Context) ([]models.MerchantIntegration, error)
	GetByMerchant(ctx context.Context, merchantID uint) ([]models.MerchantIntegration, error)
	Upsert(ctx context.Context, merchantID uint, app string, req *models.UpsertIntegrationRequest) (*models.MerchantIntegration, error)
}

type integrationService struct {
	repo repositories.IntegrationRepository
}

func NewIntegrationService(repo repositories.IntegrationRepository) IntegrationService {
	return &integrationService{repo: repo}
}

func (s *integrationService) GetAll(ctx context.Context) ([]models.MerchantIntegration, error) {
	return s.repo.GetAll(ctx)
}

func (s *integrationService) GetByMerchant(ctx context.Context, merchantID uint) ([]models.MerchantIntegration, error) {
	return s.repo.GetByMerchant(ctx, merchantID)
}

func (s *integrationService) Upsert(ctx context.Context, merchantID uint, app string, req *models.UpsertIntegrationRequest) (*models.MerchantIntegration, error) {
	if req.Config == nil {
		req.Config = map[string]interface{}{}
	}
	i := &models.MerchantIntegration{
		MerchantID: merchantID,
		App:        app,
		Enabled:    req.Enabled,
		Config:     req.Config,
	}
	if err := s.repo.Upsert(ctx, i); err != nil {
		return nil, err
	}
	return i, nil
}
