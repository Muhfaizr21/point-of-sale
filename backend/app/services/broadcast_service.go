package services

import (
	"context"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/repositories"
	"strings"
)

type BroadcastService interface {
	Create(ctx context.Context, req *models.CreateBroadcastRequest, userID uint) (*models.Broadcast, error)
	GetAll(ctx context.Context, page, limit int) ([]models.Broadcast, int64, error)
	GetByID(ctx context.Context, id uint) (*models.Broadcast, error)
	Delete(ctx context.Context, id uint) error
	GetUnread(ctx context.Context, merchantID uint) ([]models.Broadcast, error)
	MarkRead(ctx context.Context, broadcastID, merchantID uint) error
}

type broadcastService struct {
	repo repositories.BroadcastRepository
}

func NewBroadcastService(repo repositories.BroadcastRepository) BroadcastService {
	return &broadcastService{repo: repo}
}

func (s *broadcastService) Create(ctx context.Context, req *models.CreateBroadcastRequest, userID uint) (*models.Broadcast, error) {
	if strings.TrimSpace(req.Title) == "" {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Judul pengumuman wajib diisi", 400)
	}
	if strings.TrimSpace(req.Message) == "" {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Pesan pengumuman wajib diisi", 400)
	}
	b := &models.Broadcast{
		Title:             req.Title,
		Message:           req.Message,
		Type:              req.Type,
		TargetMerchantIDs: req.TargetMerchantIDs,
		CreatedByID:       userID,
	}
	return s.repo.Create(ctx, b)
}

func (s *broadcastService) GetAll(ctx context.Context, page, limit int) ([]models.Broadcast, int64, error) {
	return s.repo.GetAll(ctx, page, limit)
}

func (s *broadcastService) GetByID(ctx context.Context, id uint) (*models.Broadcast, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *broadcastService) Delete(ctx context.Context, id uint) error {
	return s.repo.Delete(ctx, id)
}

func (s *broadcastService) GetUnread(ctx context.Context, merchantID uint) ([]models.Broadcast, error) {
	all, err := s.repo.GetUnreadByMerchant(ctx, merchantID)
	if err != nil { return nil, err }
	// Filter by target_merchant_ids for 'merchant' type
	var filtered []models.Broadcast
	for _, b := range all {
		if b.Type == "general" {
			filtered = append(filtered, b)
		} else if b.Type == "merchant" {
			for _, mid := range b.TargetMerchantIDs {
				if mid == merchantID {
					filtered = append(filtered, b)
					break
				}
			}
		}
	}
	return filtered, nil
}

func (s *broadcastService) MarkRead(ctx context.Context, broadcastID, merchantID uint) error {
	return s.repo.MarkRead(ctx, broadcastID, merchantID)
}
