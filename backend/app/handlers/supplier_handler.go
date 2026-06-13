package handlers

import (
	"encoding/json"
	"net/http"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/services"
	"strconv"
)

type SupplierHandler struct {
	svc services.SupplierService
}

func NewSupplierHandler(svc services.SupplierService) *SupplierHandler {
	return &SupplierHandler{svc: svc}
}

func (h *SupplierHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	list, err := h.svc.GetAll(r.Context())
	if err != nil { models.WriteError(w, err); return }
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

func (h *SupplierHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	s, err := h.svc.GetByID(r.Context(), uint(id))
	if err != nil { models.WriteError(w, err); return }
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s)
}

func (h *SupplierHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateSupplierRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400))
		return
	}
	s, err := h.svc.Create(r.Context(), &req)
	if err != nil { models.WriteError(w, err); return }
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(s)
}

func (h *SupplierHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	var req models.UpdateSupplierRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400))
		return
	}
	s, err := h.svc.Update(r.Context(), uint(id), &req)
	if err != nil { models.WriteError(w, err); return }
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s)
}

func (h *SupplierHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	if err := h.svc.Delete(r.Context(), uint(id)); err != nil {
		models.WriteError(w, err); return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Supplier berhasil dihapus"})
}
