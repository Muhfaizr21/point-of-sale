package services

import (
	"context"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/repositories"
)

type CategoryService interface {
	GetAllCategories(ctx context.Context) ([]models.Category, error)
	GetCategoryByID(ctx context.Context, id uint) (*models.Category, error)
	CreateCategory(ctx context.Context, category *models.Category) error
	UpdateCategory(ctx context.Context, category *models.Category) error
	DeleteCategory(ctx context.Context, id uint) error
}

type categoryService struct {
	repo        repositories.CategoryRepository
	productRepo repositories.ProductRepository
}

func NewCategoryService(repo repositories.CategoryRepository, productRepo repositories.ProductRepository) CategoryService {
	return &categoryService{repo: repo, productRepo: productRepo}
}

func (s *categoryService) GetAllCategories(ctx context.Context) ([]models.Category, error) {
	return s.repo.GetAll(ctx)
}

func (s *categoryService) GetCategoryByID(ctx context.Context, id uint) (*models.Category, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *categoryService) CreateCategory(ctx context.Context, category *models.Category) error {
	if category.Name == "" {
		return models.NewAPIError(models.ErrInvalidInput, "Category name is required", 400)
	}
	return s.repo.Create(ctx, category)
}

func (s *categoryService) UpdateCategory(ctx context.Context, category *models.Category) error {
	if category.Name == "" {
		return models.NewAPIError(models.ErrInvalidInput, "Category name is required", 400)
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

	// Sinkronisasi nama kategori di tabel produk jika namanya berubah
	if oldName != newName {
		err = s.productRepo.UpdateCategoryName(ctx, oldName, newName)
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *categoryService) DeleteCategory(ctx context.Context, id uint) error {
	return s.repo.Delete(ctx, id)
}
