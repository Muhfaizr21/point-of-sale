package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"point-of-sale/backend/app/middleware"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/services"
	"strconv"
	"strings"
	"time"
)

type PromoHandler struct {
	service services.PromoService
}

func NewPromoHandler(service services.PromoService) *PromoHandler {
	return &PromoHandler{service: service}
}

func (h *PromoHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	var branchID *uint
	if bid := r.URL.Query().Get("branch_id"); bid != "" {
		if id, err := strconv.ParseUint(bid, 10, 32); err == nil {
			uid := uint(id); branchID = &uid
		}
	}
	if branchID == nil {
		if user := middleware.GetUser(r); user != nil {
			branchID = user.BranchID
		}
	}
	merchantID := getMerchantID(r)
	h.service.DeactivateExpiredPromos(r.Context(), branchID, merchantID)
	promos, err := h.service.GetAllPromos(r.Context(), branchID, merchantID)
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(promos)
}

func (h *PromoHandler) GetActive(w http.ResponseWriter, r *http.Request) {
	var branchID *uint
	if bid := r.URL.Query().Get("branch_id"); bid != "" {
		if id, err := strconv.ParseUint(bid, 10, 32); err == nil {
			uid := uint(id); branchID = &uid
		}
	}
	if branchID == nil {
		if user := middleware.GetUser(r); user != nil {
			branchID = user.BranchID
		}
	}
	merchantID := getMerchantID(r)
	h.service.DeactivateExpiredPromos(r.Context(), branchID, merchantID)
	promos, err := h.service.GetAllPromos(r.Context(), branchID, merchantID)
	if err != nil {
		models.WriteError(w, err)
		return
	}
	now := time.Now()
	curTime := now.Format("15:04")
	curDay := int(now.Weekday())
	var active []models.Promo
	for _, p := range promos {
		if !p.Active {
			continue
		}
		if p.DayOfWeek != "" {
			days := parseDays(p.DayOfWeek)
			if !containsDay(days, curDay) {
				continue
			}
		}
		if p.TimeStart != "" && p.TimeEnd != "" {
			if p.TimeStart <= p.TimeEnd {
				if curTime < p.TimeStart || curTime > p.TimeEnd {
					continue
				}
			} else {
				if curTime < p.TimeStart && curTime > p.TimeEnd {
					continue
				}
			}
		}
		active = append(active, p)
	}
	if active == nil {
		active = []models.Promo{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(active)
}

func parseDays(dayStr string) []int {
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
	return days
}

func containsDay(days []int, day int) bool {
	for _, d := range days {
		if d == day {
			return true
		}
	}
	return false
}


func (h *PromoHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "ID promo tidak valid", 400))
		return
	}
	promo, err := h.service.GetPromoByID(r.Context(), uint(id))
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(promo)
}

func (h *PromoHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreatePromoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format input tidak valid", 400))
		return
	}
	if req.BranchID == nil {
		if bid := r.URL.Query().Get("branch_id"); bid != "" {
			if id, err := strconv.ParseUint(bid, 10, 32); err == nil {
				uid := uint(id); req.BranchID = &uid
			}
		}
	}
	if req.BranchID == nil {
		if user := middleware.GetUser(r); user != nil {
			req.BranchID = user.BranchID
		}
	}
	if req.MerchantID == nil {
		if user := middleware.GetUser(r); user != nil {
			req.MerchantID = user.MerchantID
		}
	}
	promo, err := h.service.CreatePromo(r.Context(), &req)
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(promo)
}

func (h *PromoHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "ID promo tidak valid", 400))
		return
	}
	existing, err := h.service.GetPromoByID(r.Context(), uint(id))
	if err != nil {
		models.WriteError(w, err)
		return
	}
	if user := middleware.GetUser(r); user != nil && user.BranchID != nil && existing.BranchID != nil && *existing.BranchID != *user.BranchID {
		models.WriteError(w, models.NewAPIError(models.ErrForbidden, "Data ini bukan milik cabang Anda", 403))
		return
	}

	var req models.UpdatePromoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format input tidak valid", 400))
		return
	}
	promo, err := h.service.UpdatePromo(r.Context(), uint(id), &req)
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(promo)
}

func (h *PromoHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "ID promo tidak valid", 400))
		return
	}
	existing, err := h.service.GetPromoByID(r.Context(), uint(id))
	if err != nil {
		models.WriteError(w, err)
		return
	}
	if user := middleware.GetUser(r); user != nil && user.BranchID != nil && existing.BranchID != nil && *existing.BranchID != *user.BranchID {
		models.WriteError(w, models.NewAPIError(models.ErrForbidden, "Data ini bukan milik cabang Anda", 403))
		return
	}

	err = h.service.DeletePromo(r.Context(), uint(id))
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Promo berhasil dihapus",
	})
}
