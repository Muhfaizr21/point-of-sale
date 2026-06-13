package handlers

import (
	"encoding/json"
	"net/http"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/services"
	"strconv"
)

type PromoHandler struct {
	service services.PromoService
}

func NewPromoHandler(service services.PromoService) *PromoHandler {
	return &PromoHandler{service: service}
}

func (h *PromoHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	h.service.DeactivateExpiredPromos(r.Context())
	promos, err := h.service.GetAllPromos(r.Context())
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(promos)
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
