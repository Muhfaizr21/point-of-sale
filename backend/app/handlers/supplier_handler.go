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

type SupplierHandler struct {
	svc services.SupplierService
}

func NewSupplierHandler(svc services.SupplierService) *SupplierHandler {
	return &SupplierHandler{svc: svc}
}

func (h *SupplierHandler) GetAll(w http.ResponseWriter, r *http.Request) {
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
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	search := strings.TrimSpace(r.URL.Query().Get("search"))

	if page > 0 && limit > 0 {
		list, total, err := h.svc.GetAllPaginated(r.Context(), page, limit, search, branchID, merchantID)
		if err != nil { models.WriteError(w, err); return }
		totalPages := int(total) / limit
		if int(total)%limit > 0 { totalPages++ }
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"data": list,
			"pagination": models.Pagination{
				Page: page, Limit: limit, TotalItems: int(total), TotalPages: totalPages,
			},
		})
		return
	}

	list, err := h.svc.GetAll(r.Context(), branchID, merchantID)
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
	existing, err := h.svc.GetByID(r.Context(), uint(id))
	if err != nil { models.WriteError(w, err); return }
	if user := middleware.GetUser(r); user != nil && user.BranchID != nil && existing.BranchID != nil && *existing.BranchID != *user.BranchID {
		models.WriteError(w, models.NewAPIError(models.ErrForbidden, "Data ini bukan milik cabang Anda", 403))
		return
	}

	s, err := h.svc.Update(r.Context(), uint(id), &req)
	if err != nil { models.WriteError(w, err); return }
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s)
}

func (h *SupplierHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	existing, err := h.svc.GetByID(r.Context(), uint(id))
	if err != nil { models.WriteError(w, err); return }
	if user := middleware.GetUser(r); user != nil && user.BranchID != nil && existing.BranchID != nil && *existing.BranchID != *user.BranchID {
		models.WriteError(w, models.NewAPIError(models.ErrForbidden, "Data ini bukan milik cabang Anda", 403))
		return
	}

	if err := h.svc.Delete(r.Context(), uint(id)); err != nil {
		models.WriteError(w, err); return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Supplier berhasil dihapus"})
}
