package services

import (
	"context"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/repositories"
	"strings"
)

type MerchantService interface {
	GetAll(ctx context.Context) ([]models.Merchant, error)
	GetByID(ctx context.Context, id uint) (*models.Merchant, error)
	Create(ctx context.Context, req *models.CreateMerchantRequest) (*models.Merchant, error)
	Update(ctx context.Context, id uint, req *models.UpdateMerchantRequest) (*models.Merchant, error)
}

type merchantService struct {
	repo repositories.MerchantRepository
}

func NewMerchantService(repo repositories.MerchantRepository) MerchantService {
	return &merchantService{repo: repo}
}

func (s *merchantService) GetAll(ctx context.Context) ([]models.Merchant, error) {
	return s.repo.GetAll(ctx)
}

func (s *merchantService) GetByID(ctx context.Context, id uint) (*models.Merchant, error) {
	m, err := s.repo.GetByID(ctx, id)
	if err != nil { return nil, models.NewAPIError(models.ErrNotFound, "Merchant tidak ditemukan", 404) }
	return m, nil
}

func (s *merchantService) Create(ctx context.Context, req *models.CreateMerchantRequest) (*models.Merchant, error) {
	if strings.TrimSpace(req.Name) == "" {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Nama merchant wajib diisi", 400)
	}
	if strings.TrimSpace(req.Code) == "" {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Kode merchant wajib diisi", 400)
	}
	m := &models.Merchant{
		Name: req.Name, Code: strings.ToUpper(strings.TrimSpace(req.Code)),
		Email: req.Email, Phone: req.Phone, Active: true,
	}
	return s.repo.Create(ctx, m)
}

func (s *merchantService) Update(ctx context.Context, id uint, req *models.UpdateMerchantRequest) (*models.Merchant, error) {
	m, err := s.repo.GetByID(ctx, id)
	if err != nil { return nil, models.NewAPIError(models.ErrNotFound, "Merchant tidak ditemukan", 404) }
	if req.Name != "" { m.Name = req.Name }
	if req.Code != "" { m.Code = strings.ToUpper(strings.TrimSpace(req.Code)) }
	if req.Email != "" { m.Email = req.Email }
	if req.Phone != "" { m.Phone = req.Phone }
	if req.Active != nil { m.Active = *req.Active }
	return m, s.repo.Update(ctx, m)
}
