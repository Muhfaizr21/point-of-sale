package services

import (
	"context"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/repositories"
	"time"
)

type TargetService interface {
	GetAllTargets(ctx context.Context, branchID *uint, merchantID *uint) ([]models.DailyTarget, error)
	GetTargetByDate(ctx context.Context, date string, branchID *uint, merchantID *uint) (*models.DailyTarget, error)
	UpsertTarget(ctx context.Context, req *models.UpsertTargetRequest) (*models.DailyTarget, error)
	DeleteTarget(ctx context.Context, date string, branchID *uint) error
}

type targetService struct {
	repo repositories.TargetRepository
}

func NewTargetService(repo repositories.TargetRepository) TargetService {
	return &targetService{repo: repo}
}

func (s *targetService) GetAllTargets(ctx context.Context, branchID *uint, merchantID *uint) ([]models.DailyTarget, error) {
	return s.repo.GetAll(ctx, branchID, merchantID)
}

func (s *targetService) GetTargetByDate(ctx context.Context, date string, branchID *uint, merchantID *uint) (*models.DailyTarget, error) {
	target, err := s.repo.GetByDate(ctx, date, branchID, merchantID)
	if err != nil {
		return nil, err
	}
	
	// If no target is set for this date, we return a default mock/fallback target
	if target == nil {
		return &models.DailyTarget{
			Date:              date,
			RevenueTarget:     1000000, // Default 1 million
			TransactionTarget: 10,      // Default 10 tx
		}, nil
	}
	return target, nil
}

func (s *targetService) UpsertTarget(ctx context.Context, req *models.UpsertTargetRequest) (*models.DailyTarget, error) {
	if req.Date == "" {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Tanggal harus diisi", 400)
	}
	
	// Validate date format YYYY-MM-DD
	_, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Format tanggal harus YYYY-MM-DD", 400)
	}

	if req.RevenueTarget < 0 {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Target pendapatan tidak boleh negatif", 400)
	}

	if req.TransactionTarget < 0 {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Target transaksi tidak boleh negatif", 400)
	}

	target := &models.DailyTarget{
		MerchantID:        req.MerchantID,
		BranchID:          req.BranchID,
		Date:              req.Date,
		RevenueTarget:     req.RevenueTarget,
		TransactionTarget: req.TransactionTarget,
	}

	err = s.repo.Upsert(ctx, target)
	if err != nil {
		return nil, err
	}

	return s.repo.GetByDate(ctx, req.Date, req.BranchID, req.MerchantID)
}

func (s *targetService) DeleteTarget(ctx context.Context, date string, branchID *uint) error {
	_, err := time.Parse("2006-01-02", date)
	if err != nil {
		return models.NewAPIError(models.ErrInvalidInput, "Format tanggal harus YYYY-MM-DD", 400)
	}
	return s.repo.Delete(ctx, date, branchID)
}
