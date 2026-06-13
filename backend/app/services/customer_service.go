package services

import (
	"context"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/repositories"
	"strings"
)

type CustomerService interface {
	GetAll(ctx context.Context) ([]models.Customer, error)
	GetByID(ctx context.Context, id uint) (*models.Customer, error)
	Create(ctx context.Context, req *models.CreateCustomerRequest) (*models.Customer, error)
	Update(ctx context.Context, id uint, req *models.UpdateCustomerRequest) (*models.Customer, error)
	Delete(ctx context.Context, id uint) error
	GetOrders(ctx context.Context, id uint) ([]models.Order, error)
}

type customerService struct {
	repo       repositories.CustomerRepository
	orderRepo  repositories.OrderRepository
}

func NewCustomerService(repo repositories.CustomerRepository, orderRepo repositories.OrderRepository) CustomerService {
	return &customerService{repo: repo, orderRepo: orderRepo}
}

func (s *customerService) GetAll(ctx context.Context) ([]models.Customer, error) {
	return s.repo.GetAll(ctx)
}

func (s *customerService) GetByID(ctx context.Context, id uint) (*models.Customer, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *customerService) Create(ctx context.Context, req *models.CreateCustomerRequest) (*models.Customer, error) {
	if strings.TrimSpace(req.Name) == "" {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Nama pelanggan wajib diisi", 400)
	}
	return s.repo.Create(ctx, &models.Customer{
		Name:        req.Name,
		Phone:       req.Phone,
		Email:       req.Email,
		Address:     req.Address,
		CreditLimit: req.CreditLimit,
		Notes:       req.Notes,
	})
}

func (s *customerService) Update(ctx context.Context, id uint, req *models.UpdateCustomerRequest) (*models.Customer, error) {
	if strings.TrimSpace(req.Name) == "" {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Nama pelanggan wajib diisi", 400)
	}
	c, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	c.Name = req.Name
	c.Phone = req.Phone
	c.Email = req.Email
	c.Address = req.Address
	c.CreditLimit = req.CreditLimit
	c.Notes = req.Notes
	if err = s.repo.Update(ctx, c); err != nil {
		return nil, err
	}
	return c, nil
}

func (s *customerService) Delete(ctx context.Context, id uint) error {
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	return s.repo.Delete(ctx, id)
}

func (s *customerService) GetOrders(ctx context.Context, id uint) ([]models.Order, error) {
	return s.orderRepo.GetByCustomerID(ctx, id)
}
