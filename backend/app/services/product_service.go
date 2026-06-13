package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/repositories"
	"regexp"
	"strings"
)

type ProductService interface {
	GetAllProducts(ctx context.Context) ([]models.Product, error)
	GetAllProductsPaginated(ctx context.Context, page, limit int, search, category string) ([]models.Product, int64, error)
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

func (s *productService) GetAllProductsPaginated(ctx context.Context, page, limit int, search, category string) ([]models.Product, int64, error) {
	return s.repo.GetAllPaginated(ctx, page, limit, search, category)
}

func (s *productService) GetProductByID(ctx context.Context, id uint) (*models.Product, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *productService) CreateProduct(ctx context.Context, req *models.CreateProductRequest) (*models.Product, error) {
	if err := s.validateCreate(req); err != nil {
		return nil, err
	}

	sku := req.SKU
	if sku == "" {
		sku = s.generateSKU(req.Name)
	}
	// Check unique SKU
	existing, err := s.repo.GetBySKU(ctx, sku)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		b := make([]byte, 2)
		rand.Read(b)
		sku = fmt.Sprintf("%s-%s", s.generateSKU(req.Name), hex.EncodeToString(b))
	}

	stock := req.Stock
	if stock <= 0 {
		stock = 100 // default stock
	}

	product := &models.Product{
		Name:       req.Name,
		Category:   req.Category,
		Price:      req.Price,
		CostPrice:  req.CostPrice,
		Icon:       req.Icon,
		SKU:        sku,
		Stock:      stock,
		TrackStock: req.TrackStock,
		Variations: req.Variations,
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
	if req.SKU != "" && req.SKU != product.SKU {
		existing, _ := s.repo.GetBySKU(ctx, req.SKU)
		if existing != nil && existing.ID != product.ID {
			return nil, models.NewAPIError(models.ErrDuplicateSKU, "SKU sudah digunakan oleh produk lain", 400)
		}
		product.SKU = req.SKU
	} else if req.SKU == "" && product.Name != req.Name {
		newSku := s.generateSKU(req.Name)
		existing, _ := s.repo.GetBySKU(ctx, newSku)
		if existing != nil && existing.ID != product.ID {
			b := make([]byte, 2)
			rand.Read(b)
			newSku = fmt.Sprintf("%s-%s", newSku, hex.EncodeToString(b))
		}
		product.SKU = newSku
	} else if req.SKU != "" {
        product.SKU = req.SKU
    }

	product.Name = req.Name
	product.Category = req.Category
	product.Price = req.Price
	product.CostPrice = req.CostPrice
	product.Icon = req.Icon
	product.Stock = req.Stock
	product.TrackStock = req.TrackStock
	product.Variations = req.Variations

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
	b := make([]byte, 2)
	rand.Read(b)
	randomSuffix := hex.EncodeToString(b)

	if len(processed) > 15 {
		processed = processed[:15]
	}
	return fmt.Sprintf("KP-%s-%s", processed, randomSuffix)
}
