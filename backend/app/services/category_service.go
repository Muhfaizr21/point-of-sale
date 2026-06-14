package services

import (
	"context"
	"fmt"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/repositories"
	"strings"
)

type CategoryService interface {
	GetAllCategories(ctx context.Context, branchID *uint, merchantID *uint) ([]models.Category, error)
	GetCategoryByID(ctx context.Context, id uint) (*models.Category, error)
	CreateCategory(ctx context.Context, category *models.Category) error
	UpdateCategory(ctx context.Context, category *models.Category) error
	DeleteCategory(ctx context.Context, id uint, merchantID *uint) error
}

type categoryService struct {
	repo        repositories.CategoryRepository
	productRepo repositories.ProductRepository
}

func NewCategoryService(repo repositories.CategoryRepository, productRepo repositories.ProductRepository) CategoryService {
	return &categoryService{repo: repo, productRepo: productRepo}
}

func (s *categoryService) GetAllCategories(ctx context.Context, branchID *uint, merchantID *uint) ([]models.Category, error) {
	return s.repo.GetAll(ctx, branchID, merchantID)
}

func (s *categoryService) GetCategoryByID(ctx context.Context, id uint) (*models.Category, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *categoryService) CreateCategory(ctx context.Context, category *models.Category) error {
	if strings.TrimSpace(category.Name) == "" {
		return models.NewAPIError(models.ErrInvalidInput, "Nama kategori wajib diisi", 400)
	}
	return s.repo.Create(ctx, category)
}

func (s *categoryService) UpdateCategory(ctx context.Context, category *models.Category) error {
	if strings.TrimSpace(category.Name) == "" {
		return models.NewAPIError(models.ErrInvalidInput, "Nama kategori wajib diisi", 400)
	}
	existing, err := s.repo.GetByID(ctx, category.ID)
	if err != nil {
		return err
	}

	oldName := existing.Name
	newName := category.Name

	err = s.repo.Update(ctx, category)
	if err != nil {
		return err
	}

	if oldName != newName {
		err = s.productRepo.UpdateCategoryName(ctx, oldName, newName)
		if err != nil {
			return err
		}
	}

	return nil
}

// #5: Prevent delete if products reference this category
func (s *categoryService) DeleteCategory(ctx context.Context, id uint, merchantID *uint) error {
	cat, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if cat == nil {
		return models.NewAPIError(models.ErrNotFound, "Kategori tidak ditemukan", 404)
	}

	products, err := s.productRepo.GetAll(ctx, merchantID)
	if err != nil {
		return err
	}
	for _, p := range products {
		if p.Category == cat.Name {
			return models.NewAPIError(models.ErrConflict,
				fmt.Sprintf("Kategori '%s' masih digunakan oleh produk '%s'", cat.Name, p.Name), 409)
		}
	}

	return s.repo.Delete(ctx, id)
}
