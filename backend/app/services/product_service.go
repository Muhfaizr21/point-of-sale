package services

import (
	"context"
	"fmt"
	"math/rand"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/repositories"
	"regexp"
	"strings"
	"time"
)

type ProductService interface {
	GetAllProducts(ctx context.Context) ([]models.Product, error)
	GetProductByID(ctx context.Context, id uint) (*models.Product, error)
	CreateProduct(ctx context.Context, req *models.CreateProductRequest) (*models.Product, error)
	UpdateProduct(ctx context.Context, id uint, req *models.UpdateProductRequest) (*models.Product, error)
	DeleteProduct(ctx context.Context, id uint) error
}

type productService struct {
	repo repositories.ProductRepository
}

func NewProductService(repo repositories.ProductRepository) ProductService {
	return &productService{repo: repo}
}

func (s *productService) GetAllProducts(ctx context.Context) ([]models.Product, error) {
	return s.repo.GetAll(ctx)
}

func (s *productService) GetProductByID(ctx context.Context, id uint) (*models.Product, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *productService) CreateProduct(ctx context.Context, req *models.CreateProductRequest) (*models.Product, error) {
	if err := s.validateCreate(req); err != nil {
		return nil, err
	}

	sku := s.generateSKU(req.Name)
	// Check unique SKU
	existing, err := s.repo.GetBySKU(ctx, sku)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		// append a random number
		sku = fmt.Sprintf("%s-%d", sku, rand.Intn(999))
	}

	stock := req.Stock
	if stock <= 0 {
		stock = 100 // default stock
	}

	product := &models.Product{
		Name:     req.Name,
		Category: req.Category,
		Price:    req.Price,
		Icon:     req.Icon,
		SKU:      sku,
		Stock:    stock,
	}

	return s.repo.Create(ctx, product)
}

func (s *productService) UpdateProduct(ctx context.Context, id uint, req *models.UpdateProductRequest) (*models.Product, error) {
	if err := s.validateUpdate(req); err != nil {
		return nil, err
	}

	product, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// If name changed, we can keep SKU or update it. Let's keep it or regenerate if name is updated.
	// To prevent URL/invoice breaks, we usually keep the original SKU or only update if explicitly wanted.
	// Let's regenerate if name changed
	if product.Name != req.Name {
		product.SKU = s.generateSKU(req.Name)
	}

	product.Name = req.Name
	product.Category = req.Category
	product.Price = req.Price
	product.Icon = req.Icon
	product.Stock = req.Stock

	err = s.repo.Update(ctx, product)
	if err != nil {
		return nil, err
	}
	return product, nil
}

func (s *productService) DeleteProduct(ctx context.Context, id uint) error {
	// check if exists
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	return s.repo.Delete(ctx, id)
}

func (s *productService) validateCreate(req *models.CreateProductRequest) error {
	if strings.TrimSpace(req.Name) == "" {
		return models.NewAPIError(models.ErrInvalidInput, "Nama produk wajib diisi", 400)
	}
	if req.Price <= 0 {
		return models.NewAPIError(models.ErrInvalidInput, "Harga produk harus lebih besar dari 0", 400)
	}
	if strings.TrimSpace(req.Category) == "" {
		return models.NewAPIError(models.ErrInvalidInput, "Kategori produk wajib diisi", 400)
	}
	if strings.TrimSpace(req.Icon) == "" {
		return models.NewAPIError(models.ErrInvalidInput, "Ikon produk wajib diisi", 400)
	}
	return nil
}

func (s *productService) validateUpdate(req *models.UpdateProductRequest) error {
	if strings.TrimSpace(req.Name) == "" {
		return models.NewAPIError(models.ErrInvalidInput, "Nama produk wajib diisi", 400)
	}
	if req.Price <= 0 {
		return models.NewAPIError(models.ErrInvalidInput, "Harga produk harus lebih besar dari 0", 400)
	}
	if strings.TrimSpace(req.Category) == "" {
		return models.NewAPIError(models.ErrInvalidInput, "Kategori produk wajib diisi", 400)
	}
	if strings.TrimSpace(req.Icon) == "" {
		return models.NewAPIError(models.ErrInvalidInput, "Ikon produk wajib diisi", 400)
	}
	return nil
}

func (s *productService) generateSKU(name string) string {
	// Replace non-alphanumeric characters with hyphens
	reg := regexp.MustCompile("[^a-zA-Z0-9]+")
	processed := reg.ReplaceAllString(name, "-")
	processed = strings.Trim(processed, "-")
	processed = strings.ToUpper(processed)

	// Add random suffix to avoid collisions
	rand.Seed(time.Now().UnixNano())
	randomSuffix := fmt.Sprintf("%04d", rand.Intn(10000))

	if len(processed) > 15 {
		processed = processed[:15]
	}
	return fmt.Sprintf("KP-%s-%s", processed, randomSuffix)
}
