package services

import (
	"context"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/repositories"
	"strings"
)

type BranchService interface {
	GetAll(ctx context.Context) ([]models.Branch, error)
	GetByID(ctx context.Context, id uint) (*models.Branch, error)
	Create(ctx context.Context, req *models.CreateBranchRequest) (*models.Branch, error)
	Update(ctx context.Context, id uint, req *models.UpdateBranchRequest) (*models.Branch, error)
	Delete(ctx context.Context, id uint) error
}

type branchService struct {
	repo           repositories.BranchRepository
	productBranchRepo repositories.ProductBranchRepository
}

func NewBranchService(repo repositories.BranchRepository, productBranchRepo repositories.ProductBranchRepository) BranchService {
	return &branchService{repo: repo, productBranchRepo: productBranchRepo}
}

func (s *branchService) GetAll(ctx context.Context) ([]models.Branch, error) {
	return s.repo.GetAll(ctx)
}

func (s *branchService) GetByID(ctx context.Context, id uint) (*models.Branch, error) {
	b, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, models.NewAPIError(models.ErrNotFound, "Cabang tidak ditemukan", 404)
	}
	return b, nil
}

func (s *branchService) Create(ctx context.Context, req *models.CreateBranchRequest) (*models.Branch, error) {
	if strings.TrimSpace(req.Name) == "" {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Nama cabang wajib diisi", 400)
	}
	if strings.TrimSpace(req.Code) == "" {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Kode cabang wajib diisi", 400)
	}
	b := &models.Branch{
		Name:    req.Name,
		Code:    strings.ToUpper(strings.TrimSpace(req.Code)),
		Address: req.Address,
		Phone:   req.Phone,
		City:    req.City,
		Active:  true,
	}
	return s.repo.Create(ctx, b)
}

func (s *branchService) Update(ctx context.Context, id uint, req *models.UpdateBranchRequest) (*models.Branch, error) {
	b, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, models.NewAPIError(models.ErrNotFound, "Cabang tidak ditemukan", 404)
	}
	if req.Name != "" {
		b.Name = req.Name
	}
	if req.Code != "" {
		b.Code = strings.ToUpper(strings.TrimSpace(req.Code))
	}
	if req.Address != "" {
		b.Address = req.Address
	}
	if req.Phone != "" {
		b.Phone = req.Phone
	}
	if req.City != "" {
		b.City = req.City
	}
	if req.Active != nil {
		b.Active = *req.Active
	}
	return b, s.repo.Update(ctx, b)
}

func (s *branchService) Delete(ctx context.Context, id uint) error {
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return models.NewAPIError(models.ErrNotFound, "Cabang tidak ditemukan", 404)
	}
	return s.repo.Delete(ctx, id)
}
