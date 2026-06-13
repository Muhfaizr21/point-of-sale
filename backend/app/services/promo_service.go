package services

import (
	"context"
	"fmt"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/repositories"
	"strings"
	"time"
)

type PromoService interface {
	GetAllPromos(ctx context.Context) ([]models.Promo, error)
	GetPromoByID(ctx context.Context, id uint) (*models.Promo, error)
	CreatePromo(ctx context.Context, req *models.CreatePromoRequest) (*models.Promo, error)
	UpdatePromo(ctx context.Context, id uint, req *models.UpdatePromoRequest) (*models.Promo, error)
	DeletePromo(ctx context.Context, id uint) error
	EvaluatePromos(ctx context.Context, items []models.OrderItem, subtotal int) ([]models.AppliedPromo, int, error)
	DeactivateExpiredPromos(ctx context.Context) error
}

type promoService struct {
	promoRepo repositories.PromoRepository
}

func NewPromoService(promoRepo repositories.PromoRepository) PromoService {
	return &promoService{promoRepo: promoRepo}
}

func (s *promoService) GetAllPromos(ctx context.Context) ([]models.Promo, error) {
	return s.promoRepo.GetAll(ctx)
}

func (s *promoService) GetPromoByID(ctx context.Context, id uint) (*models.Promo, error) {
	return s.promoRepo.GetByID(ctx, id)
}

func (s *promoService) CreatePromo(ctx context.Context, req *models.CreatePromoRequest) (*models.Promo, error) {
	if strings.TrimSpace(req.Name) == "" {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Nama promo wajib diisi", 400)
	}
	if req.Value <= 0 {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Nilai promo harus lebih besar dari 0", 400)
	}

	promo := &models.Promo{
		Name:          req.Name,
		Type:          req.Type,
		Value:         req.Value,
		MinAmount:     req.MinAmount,
		BuyQty:        req.BuyQty,
		FreeQty:       req.FreeQty,
		FreeProductID: req.FreeProductID,
		TimeStart:     req.TimeStart,
		TimeEnd:       req.TimeEnd,
		DayOfWeek:     req.DayOfWeek,
		ProductIDs:    req.ProductIDs,
		Active:        true,
	}

	return s.promoRepo.Create(ctx, promo)
}

func (s *promoService) UpdatePromo(ctx context.Context, id uint, req *models.UpdatePromoRequest) (*models.Promo, error) {
	if strings.TrimSpace(req.Name) == "" {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Nama promo wajib diisi", 400)
	}
	if req.Value <= 0 {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Nilai promo harus lebih besar dari 0", 400)
	}

	promo, err := s.promoRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	promo.Name = req.Name
	promo.Type = req.Type
	promo.Value = req.Value
	promo.MinAmount = req.MinAmount
	promo.BuyQty = req.BuyQty
	promo.FreeQty = req.FreeQty
	promo.FreeProductID = req.FreeProductID
	promo.TimeStart = req.TimeStart
	promo.TimeEnd = req.TimeEnd
	promo.DayOfWeek = req.DayOfWeek
	promo.ProductIDs = req.ProductIDs
	promo.Active = req.Active

	err = s.promoRepo.Update(ctx, promo)
	if err != nil {
		return nil, err
	}
	return promo, nil
}

func (s *promoService) DeletePromo(ctx context.Context, id uint) error {
	_, err := s.promoRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	return s.promoRepo.Delete(ctx, id)
}

func (s *promoService) EvaluatePromos(ctx context.Context, items []models.OrderItem, subtotal int) ([]models.AppliedPromo, int, error) {
	// Auto-deactivate expired promos before evaluating
	s.DeactivateExpiredPromos(ctx)

	activePromos, err := s.promoRepo.GetActivePromos(ctx)
	if err != nil {
		return nil, 0, err
	}

	now := time.Now()
	currentTime := now.Format("15:04")
	currentDay := int(now.Weekday())

	var applied []models.AppliedPromo
	totalDiscount := 0

	for _, promo := range activePromos {
		if !s.isTimeValid(&promo, currentTime, currentDay) {
			continue
		}

		discount := s.evaluateSinglePrompt(&promo, items, subtotal)
		if discount > 0 {
			applied = append(applied, models.AppliedPromo{
				PromoID:        promo.ID,
				PromoName:      promo.Name,
				DiscountAmount: discount,
			})
			totalDiscount += discount
		}
	}

	return applied, totalDiscount, nil
}

func (s *promoService) DeactivateExpiredPromos(ctx context.Context) error {
	activePromos, err := s.promoRepo.GetActivePromos(ctx)
	if err != nil {
		return err
	}

	now := time.Now()
	currentTime := now.Format("15:04")
	currentDay := int(now.Weekday())

	for _, promo := range activePromos {
		if s.isExpired(&promo, currentTime, currentDay) {
			promo.Active = false
			s.promoRepo.Update(ctx, &promo)
		}
	}
	return nil
}

func (s *promoService) isExpired(promo *models.Promo, currentTime string, currentDay int) bool {
	if s.isTimeValid(promo, currentTime, currentDay) {
		return false
	}

	days := s.parseDays(promo.DayOfWeek)
	if len(days) == 0 {
		return false // everyday promos never truly expire
	}

	lastDay := days[len(days)-1]
	daysSince := (currentDay - lastDay + 7) % 7

	if promo.TimeStart != "" && promo.TimeEnd != "" {
		if promo.TimeStart <= promo.TimeEnd {
			// Non-overnight: expires same day at timeEnd
			return daysSince > 0 || (daysSince == 0 && currentTime > promo.TimeEnd)
		} else {
			// Overnight: expires next day at timeEnd
			return daysSince > 1 || (daysSince == 1 && currentTime > promo.TimeEnd)
		}
	}
	return daysSince > 0
}

func (s *promoService) isTimeValid(promo *models.Promo, currentTime string, currentDay int) bool {
	days := s.parseDays(promo.DayOfWeek)
	isOvernight := promo.TimeStart > promo.TimeEnd

	if len(days) > 0 {
		found := false
		for _, dayNum := range days {
			if dayNum == currentDay {
				found = true
				break
			}
			// For overnight promos, also check the day after (midnight to timeEnd)
			if isOvernight && (currentDay == (dayNum+1)%7) && currentTime <= promo.TimeEnd {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}

	if promo.TimeStart != "" && promo.TimeEnd != "" {
		if !isOvernight {
			if currentTime < promo.TimeStart || currentTime > promo.TimeEnd {
				return false
			}
		} else {
			if currentTime < promo.TimeStart && currentTime > promo.TimeEnd {
				return false
			}
		}
	}

	return true
}

func (s *promoService) parseDays(dayStr string) []int {
	if dayStr == "" {
		return nil
	}
	parts := strings.Split(dayStr, ",")
	days := make([]int, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		var d int
		if _, err := fmt.Sscanf(p, "%d", &d); err == nil {
			days = append(days, d)
		}
	}
	// Sort ascending
	for i := 0; i < len(days)-1; i++ {
		for j := i + 1; j < len(days); j++ {
			if days[i] > days[j] {
				days[i], days[j] = days[j], days[i]
			}
		}
	}
	return days
}

func (s *promoService) evaluateSinglePrompt(promo *models.Promo, items []models.OrderItem, subtotal int) int {
	switch promo.Type {
	case "PERCENT":
		if promo.MinAmount > 0 && subtotal < promo.MinAmount {
			return 0
		}
		discount := subtotal * promo.Value / 100
		return discount

	case "NOMINAL":
		if promo.MinAmount > 0 && subtotal < promo.MinAmount {
			return 0
		}
		return promo.Value

	case "BOGO":
		return s.evaluateBOGO(promo, items)

	default:
		return 0
	}
}

func (s *promoService) evaluateBOGO(promo *models.Promo, items []models.OrderItem) int {
	targetQty := 0
	for _, item := range items {
		if item.IsBundle || item.ProductID == 0 {
			continue // #6: skip bundle items
		}
		if len(promo.ProductIDs) == 0 {
			targetQty += item.Quantity
		} else {
			for _, pid := range promo.ProductIDs {
				if item.ProductID == pid {
					targetQty += item.Quantity
					break
				}
			}
		}
	}

	buyQty := promo.BuyQty
	if buyQty <= 0 {
		buyQty = 2
	}
	freeQty := promo.FreeQty
	if freeQty <= 0 {
		freeQty = 1
	}

	qualifyingSets := targetQty / buyQty
	if qualifyingSets == 0 {
		return 0
	}

	if promo.FreeProductID != nil {
		for _, item := range items {
			if item.ProductID == *promo.FreeProductID {
				freeItemsTotal := item.Price * freeQty * qualifyingSets
				return freeItemsTotal
			}
		}
		return 0
	}

	cheapestPrice := int(^uint(0) >> 1)
	for _, item := range items {
		if item.IsBundle || item.ProductID == 0 {
			continue
		}
		if item.Price < cheapestPrice {
			cheapestPrice = item.Price
		}
	}
	if cheapestPrice == int(^uint(0)>>1) {
		return 0
	}
	return cheapestPrice * freeQty * qualifyingSets
}
