package handlers

import (
	"encoding/json"
	"net/http"
	"point-of-sale/backend/app/middleware"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/services"
)

type TargetHandler struct {
	service services.TargetService
}

func NewTargetHandler(service services.TargetService) *TargetHandler {
	return &TargetHandler{service: service}
}

func (h *TargetHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	branchID := parseBranchID(r)
	merchantID := getMerchantID(r)
	targets, err := h.service.GetAllTargets(r.Context(), branchID, merchantID)
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(targets)
}

func (h *TargetHandler) GetByDate(w http.ResponseWriter, r *http.Request) {
	date := r.PathValue("date")
	if date == "" {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Tanggal tidak valid", 400))
		return
	}
	branchID := parseBranchID(r)
	merchantID := getMerchantID(r)
	target, err := h.service.GetTargetByDate(r.Context(), date, branchID, merchantID)
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(target)
}

func (h *TargetHandler) Upsert(w http.ResponseWriter, r *http.Request) {
	var req models.UpsertTargetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format input tidak valid", 400))
		return
	}
	if req.BranchID == nil {
		if user := middleware.GetUser(r); user != nil && user.BranchID != nil {
			req.BranchID = user.BranchID
		}
	}
	if req.MerchantID == nil {
		if user := middleware.GetUser(r); user != nil {
			req.MerchantID = user.MerchantID
		}
	}
	target, err := h.service.UpsertTarget(r.Context(), &req)
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(target)
}

func (h *TargetHandler) Delete(w http.ResponseWriter, r *http.Request) {
	date := r.PathValue("date")
	if date == "" {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Tanggal tidak valid", 400))
		return
	}
	branchID := parseBranchID(r)
	err := h.service.DeleteTarget(r.Context(), date, branchID)
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Target berhasil dihapus",
	})
}
