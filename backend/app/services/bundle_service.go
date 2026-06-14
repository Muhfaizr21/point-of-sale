package services

import (
	"context"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/repositories"
	"strings"
)

type BundleService interface {
	GetAllBundles(ctx context.Context, branchID *uint, merchantID *uint) ([]models.Bundle, error)
	GetBundleByID(ctx context.Context, id uint) (*models.Bundle, error)
	CreateBundle(ctx context.Context, req *models.CreateBundleRequest) (*models.Bundle, error)
	UpdateBundle(ctx context.Context, id uint, req *models.UpdateBundleRequest) (*models.Bundle, error)
	DeleteBundle(ctx context.Context, id uint) error
	ResolveBundleItems(ctx context.Context, bundleID uint, quantity int) ([]models.OrderItem, int, error)
}

type bundleService struct {
	bundleRepo repositories.BundleRepository
}

func NewBundleService(bundleRepo repositories.BundleRepository) BundleService {
	return &bundleService{bundleRepo: bundleRepo}
}

func (s *bundleService) GetAllBundles(ctx context.Context, branchID *uint, merchantID *uint) ([]models.Bundle, error) {
	return s.bundleRepo.GetAll(ctx, branchID, merchantID)
}

func (s *bundleService) GetBundleByID(ctx context.Context, id uint) (*models.Bundle, error) {
	return s.bundleRepo.GetByID(ctx, id)
}

func (s *bundleService) CreateBundle(ctx context.Context, req *models.CreateBundleRequest) (*models.Bundle, error) {
	if strings.TrimSpace(req.Name) == "" {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Nama bundle wajib diisi", 400)
	}
	if req.Price <= 0 {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Harga bundle harus lebih besar dari 0", 400)
	}
	if len(req.Items) == 0 {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Bundle harus memiliki minimal 1 item", 400)
	}

	items := make([]models.BundleItem, len(req.Items))
	for i, item := range req.Items {
		if item.ProductID == 0 {
			return nil, models.NewAPIError(models.ErrInvalidInput, "Product ID wajib diisi untuk setiap item bundle", 400)
		}
		if item.Quantity <= 0 {
			item.Quantity = 1
		}
		items[i] = models.BundleItem{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
		}
	}

	active := true
	if req.Active != nil {
		active = *req.Active
	}
	bundle := &models.Bundle{
		BranchID: req.BranchID,
		Name:     req.Name,
		Price:    req.Price,
		Icon:     req.Icon,
		Active:   active,
		Items:    items,
	}

	return s.bundleRepo.Create(ctx, bundle)
}

func (s *bundleService) UpdateBundle(ctx context.Context, id uint, req *models.UpdateBundleRequest) (*models.Bundle, error) {
	if strings.TrimSpace(req.Name) == "" {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Nama bundle wajib diisi", 400)
	}
	if req.Price <= 0 {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Harga bundle harus lebih besar dari 0", 400)
	}
	if len(req.Items) == 0 {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Bundle harus memiliki minimal 1 item", 400)
	}

	bundle, err := s.bundleRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	bundle.Name = req.Name
	bundle.Price = req.Price
	bundle.Icon = req.Icon
	if req.Active != nil {
		bundle.Active = *req.Active
	}

	items := make([]models.BundleItem, len(req.Items))
	for i, item := range req.Items {
		if item.Quantity <= 0 {
			item.Quantity = 1
		}
		items[i] = models.BundleItem{
			BundleID:  bundle.ID,
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
		}
	}
	bundle.Items = items

	err = s.bundleRepo.Update(ctx, bundle)
	if err != nil {
		return nil, err
	}
	return bundle, nil
}

func (s *bundleService) DeleteBundle(ctx context.Context, id uint) error {
	_, err := s.bundleRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	return s.bundleRepo.Delete(ctx, id)
}

func (s *bundleService) ResolveBundleItems(ctx context.Context, bundleID uint, quantity int) ([]models.OrderItem, int, error) {
	bundle, err := s.bundleRepo.GetByID(ctx, bundleID)
	if err != nil {
		return nil, 0, err
	}

	if !bundle.Active {
		return nil, 0, models.NewAPIError(models.ErrInvalidInput, "Bundle tidak aktif", 400)
	}

	var items []models.OrderItem
	for _, bi := range bundle.Items {
		qty := bi.Quantity * quantity
		price := 0
		if bi.Product.ID != 0 {
			price = bi.Product.Price
		}
		items = append(items, models.OrderItem{
			ProductID:   bi.ProductID,
			ProductName: bi.Product.Name,
			Price:       price,
			Quantity:    qty,
		})
	}

	return items, bundle.Price * quantity, nil
}
