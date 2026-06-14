package handlers

import (
	"encoding/json"
	"net/http"
	"point-of-sale/backend/app/middleware"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/services"
	"strconv"
)

type BundleHandler struct {
	service services.BundleService
}

func NewBundleHandler(service services.BundleService) *BundleHandler {
	return &BundleHandler{service: service}
}

func (h *BundleHandler) GetAll(w http.ResponseWriter, r *http.Request) {
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
	bundles, err := h.service.GetAllBundles(r.Context(), branchID, merchantID)
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bundles)
}

func (h *BundleHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "ID bundle tidak valid", 400))
		return
	}
	bundle, err := h.service.GetBundleByID(r.Context(), uint(id))
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bundle)
}

func (h *BundleHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateBundleRequest
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
	bundle, err := h.service.CreateBundle(r.Context(), &req)
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(bundle)
}

func (h *BundleHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "ID bundle tidak valid", 400))
		return
	}
	existing, err := h.service.GetBundleByID(r.Context(), uint(id))
	if err != nil {
		models.WriteError(w, err)
		return
	}
	if user := middleware.GetUser(r); user != nil && user.BranchID != nil && existing.BranchID != nil && *existing.BranchID != *user.BranchID {
		models.WriteError(w, models.NewAPIError(models.ErrForbidden, "Data ini bukan milik cabang Anda", 403))
		return
	}

	var req models.UpdateBundleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format input tidak valid", 400))
		return
	}
	bundle, err := h.service.UpdateBundle(r.Context(), uint(id), &req)
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bundle)
}

func (h *BundleHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "ID bundle tidak valid", 400))
		return
	}
	existing, err := h.service.GetBundleByID(r.Context(), uint(id))
	if err != nil {
		models.WriteError(w, err)
		return
	}
	if user := middleware.GetUser(r); user != nil && user.BranchID != nil && existing.BranchID != nil && *existing.BranchID != *user.BranchID {
		models.WriteError(w, models.NewAPIError(models.ErrForbidden, "Data ini bukan milik cabang Anda", 403))
		return
	}

	err = h.service.DeleteBundle(r.Context(), uint(id))
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Bundle berhasil dihapus",
	})
}
