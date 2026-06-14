package handlers

import (
	"encoding/json"
	"net/http"
	"point-of-sale/backend/app/middleware"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/services"
	"strconv"
)

type IntegrationHandler struct {
	svc services.IntegrationService
}

func NewIntegrationHandler(svc services.IntegrationService) *IntegrationHandler {
	return &IntegrationHandler{svc: svc}
}

func (h *IntegrationHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	merchantIDStr := r.URL.Query().Get("merchant_id")
	if merchantIDStr != "" {
		merchantID, _ := strconv.ParseUint(merchantIDStr, 10, 32)
		list, err := h.svc.GetByMerchant(r.Context(), uint(merchantID))
		if err != nil { models.WriteError(w, err); return }
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(list)
		return
	}
	list, err := h.svc.GetAll(r.Context())
	if err != nil { models.WriteError(w, err); return }
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

func (h *IntegrationHandler) GetMy(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	if user == nil || user.MerchantID == nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]models.MerchantIntegration{})
		return
	}
	list, err := h.svc.GetByMerchant(r.Context(), *user.MerchantID)
	if err != nil { models.WriteError(w, err); return }
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

func (h *IntegrationHandler) UpdateMy(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	if user == nil || user.MerchantID == nil {
		models.WriteError(w, models.NewAPIError(models.ErrUnauthorized, "Silakan login", 401)); return
	}
	app := r.PathValue("app")
	if app == "" {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "App tidak valid", 400)); return
	}
	var req models.UpsertIntegrationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400)); return
	}
	i, err := h.svc.Upsert(r.Context(), *user.MerchantID, app, &req)
	if err != nil { models.WriteError(w, err); return }
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(i)
}

func (h *IntegrationHandler) Upsert(w http.ResponseWriter, r *http.Request) {
	merchantIDStr := r.PathValue("merchant_id")
	merchantID, _ := strconv.ParseUint(merchantIDStr, 10, 32)
	if merchantID == 0 {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Merchant ID tidak valid", 400)); return
	}
	app := r.PathValue("app")
	if app == "" {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "App tidak valid", 400)); return
	}
	var req models.UpsertIntegrationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400)); return
	}
	i, err := h.svc.Upsert(r.Context(), uint(merchantID), app, &req)
	if err != nil { models.WriteError(w, err); return }
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(i)
}
