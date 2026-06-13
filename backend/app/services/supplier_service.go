package services

import (
	"context"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/repositories"
	"strings"
)

type SupplierService interface {
	GetAll(ctx context.Context) ([]models.Supplier, error)
	GetByID(ctx context.Context, id uint) (*models.Supplier, error)
	Create(ctx context.Context, req *models.CreateSupplierRequest) (*models.Supplier, error)
	Update(ctx context.Context, id uint, req *models.UpdateSupplierRequest) (*models.Supplier, error)
	Delete(ctx context.Context, id uint) error
}

type supplierService struct {
	repo repositories.SupplierRepository
}

func NewSupplierService(repo repositories.SupplierRepository) SupplierService {
	return &supplierService{repo: repo}
}

func (s *supplierService) GetAll(ctx context.Context) ([]models.Supplier, error) {
	return s.repo.GetAll(ctx)
}

func (s *supplierService) GetByID(ctx context.Context, id uint) (*models.Supplier, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *supplierService) Create(ctx context.Context, req *models.CreateSupplierRequest) (*models.Supplier, error) {
	if strings.TrimSpace(req.Name) == "" {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Nama supplier wajib diisi", 400)
	}
	return s.repo.Create(ctx, &models.Supplier{
		Name:          req.Name,
		ContactPerson: req.ContactPerson,
		Phone:         req.Phone,
		Email:         req.Email,
		Address:       req.Address,
		Notes:         req.Notes,
	})
}

func (s *supplierService) Update(ctx context.Context, id uint, req *models.UpdateSupplierRequest) (*models.Supplier, error) {
	if strings.TrimSpace(req.Name) == "" {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Nama supplier wajib diisi", 400)
	}
	sup, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	sup.Name = req.Name
	sup.ContactPerson = req.ContactPerson
	sup.Phone = req.Phone
	sup.Email = req.Email
	sup.Address = req.Address
	sup.Notes = req.Notes
	if err = s.repo.Update(ctx, sup); err != nil {
		return nil, err
	}
	return sup, nil
}

func (s *supplierService) Delete(ctx context.Context, id uint) error {
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	return s.repo.Delete(ctx, id)
}
