package handlers

import (
	"encoding/json"
	"net/http"
	"point-of-sale/backend/app/middleware"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/services"
	"strconv"
	"strings"
)

type AnalyticsHandler struct {
	service services.AnalyticsService
}

func NewAnalyticsHandler(service services.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{service: service}
}

func (h *AnalyticsHandler) GetAnalytics(w http.ResponseWriter, r *http.Request) {
	query := &models.AnalyticsQuery{}

	// Parse date_from
	if df := r.URL.Query().Get("date_from"); df != "" {
		query.DateFrom = strings.TrimSpace(df)
	}

	// Parse date_to
	if dt := r.URL.Query().Get("date_to"); dt != "" {
		query.DateTo = strings.TrimSpace(dt)
	}

	// Parse branch_id
	if bid := r.URL.Query().Get("branch_id"); bid != "" {
		if id, err := strconv.ParseUint(bid, 10, 32); err == nil {
			uid := uint(id)
			query.BranchID = &uid
		}
	} else if user := middleware.GetUser(r); user != nil && user.BranchID != nil {
		query.BranchID = user.BranchID
	}

	// Parse merchant_id
	if mid := r.URL.Query().Get("merchant_id"); mid != "" {
		if id, err := strconv.ParseUint(mid, 10, 32); err == nil {
			uid := uint(id)
			query.MerchantID = &uid
		}
	} else if user := middleware.GetUser(r); user != nil && user.MerchantID != nil {
		query.MerchantID = user.MerchantID
	}

	result, err := h.service.GetAnalytics(r.Context(), query)
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInternalError, "Failed to fetch analytics", 500))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}
