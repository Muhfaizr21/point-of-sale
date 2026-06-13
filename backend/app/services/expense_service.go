package services

import (
	"context"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/repositories"
	"strings"
)

type ExpenseService interface {
	GetFiltered(ctx context.Context, query *models.ExpenseQuery) (*models.ExpenseListResponse, error)
	GetByID(ctx context.Context, id uint) (*models.Expense, error)
	Create(ctx context.Context, req *models.CreateExpenseRequest) (*models.Expense, error)
	Update(ctx context.Context, id uint, req *models.UpdateExpenseRequest) (*models.Expense, error)
	Delete(ctx context.Context, id uint) error
}

type expenseService struct {
	repo repositories.ExpenseRepository
}

func NewExpenseService(repo repositories.ExpenseRepository) ExpenseService {
	return &expenseService{repo: repo}
}

func (s *expenseService) GetFiltered(ctx context.Context, query *models.ExpenseQuery) (*models.ExpenseListResponse, error) {
	if query.Page < 1 {
		query.Page = 1
	}
	if query.Limit < 1 {
		query.Limit = 20
	}
	if query.SortBy == "" {
		query.SortBy = "date"
	}
	if query.SortOrder == "" {
		query.SortOrder = "desc"
	}

	list, total, err := s.repo.GetFiltered(ctx, query)
	if err != nil {
		return nil, err
	}

	totalPages := int(total) / query.Limit
	if int(total)%query.Limit > 0 {
		totalPages++
	}

	return &models.ExpenseListResponse{
		Data: list,
		Pagination: models.Pagination{
			Page:       query.Page,
			Limit:      query.Limit,
			TotalItems: int(total),
			TotalPages: totalPages,
		},
	}, nil
}

func (s *expenseService) GetByID(ctx context.Context, id uint) (*models.Expense, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *expenseService) Create(ctx context.Context, req *models.CreateExpenseRequest) (*models.Expense, error) {
	if strings.TrimSpace(req.Description) == "" {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Deskripsi pengeluaran wajib diisi", 400)
	}
	if req.Amount <= 0 {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Jumlah pengeluaran harus lebih dari 0", 400)
	}
	if strings.TrimSpace(req.Date) == "" {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Tanggal pengeluaran wajib diisi", 400)
	}
	return s.repo.Create(ctx, &models.Expense{
		Date:        req.Date,
		Description: req.Description,
		Amount:      req.Amount,
		Category:    req.Category,
		Notes:       req.Notes,
		BranchID:    req.BranchID,
	})
}

func (s *expenseService) Update(ctx context.Context, id uint, req *models.UpdateExpenseRequest) (*models.Expense, error) {
	if strings.TrimSpace(req.Description) == "" {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Deskripsi pengeluaran wajib diisi", 400)
	}
	if req.Amount <= 0 {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Jumlah pengeluaran harus lebih dari 0", 400)
	}
	exp, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	exp.Date = req.Date
	exp.Description = req.Description
	exp.Amount = req.Amount
	exp.Category = req.Category
	exp.Notes = req.Notes
	if err = s.repo.Update(ctx, exp); err != nil {
		return nil, err
	}
	return exp, nil
}

func (s *expenseService) Delete(ctx context.Context, id uint) error {
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	return s.repo.Delete(ctx, id)
}
