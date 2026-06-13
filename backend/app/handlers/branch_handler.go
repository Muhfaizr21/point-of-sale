package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"point-of-sale/backend/app/middleware"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/repositories"
	"point-of-sale/backend/app/services"
	"strconv"
)

type BranchHandler struct {
	svc              services.BranchService
	productBranchRepo repositories.ProductBranchRepository
}

func NewBranchHandler(svc services.BranchService, pbr repositories.ProductBranchRepository) *BranchHandler {
	return &BranchHandler{svc: svc, productBranchRepo: pbr}
}

func (h *BranchHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	list, err := h.svc.GetAll(r.Context())
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

func (h *BranchHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	b, err := h.svc.GetByID(r.Context(), uint(id))
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(b)
}

func (h *BranchHandler) Create(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	if user == nil || user.Role != "owner" {
		models.WriteError(w, models.NewAPIError(models.ErrForbidden, "Hanya owner yang dapat membuat cabang", 403))
		return
	}
	var req models.CreateBranchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400))
		return
	}
	b, err := h.svc.Create(r.Context(), &req)
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(b)
}

func (h *BranchHandler) Update(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	if user == nil || user.Role != "owner" {
		models.WriteError(w, models.NewAPIError(models.ErrForbidden, "Hanya owner yang dapat mengubah cabang", 403))
		return
	}
	id, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	var req models.UpdateBranchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400))
		return
	}
	b, err := h.svc.Update(r.Context(), uint(id), &req)
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(b)
}

func (h *BranchHandler) CopyProducts(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	if user == nil || user.Role != "owner" {
		models.WriteError(w, models.NewAPIError(models.ErrForbidden, "Hanya owner", 403))
		return
	}
	targetID, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	fromStr := r.URL.Query().Get("from")
	fromID, err := strconv.ParseUint(fromStr, 10, 32)
	if err != nil || fromID == 0 || targetID == 0 {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Parameter 'from' diperlukan", 400))
		return
	}
	if targetID == fromID {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Tidak bisa copy ke cabang yang sama", 400))
		return
	}

	sourcePrices, err := h.productBranchRepo.GetByBranch(r.Context(), uint(fromID))
	if err != nil {
		models.WriteError(w, err)
		return
	}

	count := 0
	for _, sp := range sourcePrices {
		pb := &models.ProductBranch{
			BranchID:   uint(targetID),
			ProductID:  sp.ProductID,
			Price:      sp.Price,
			CostPrice:  sp.CostPrice,
			Stock:      sp.Stock,
			TrackStock: sp.TrackStock,
		}
		if err := h.productBranchRepo.Upsert(r.Context(), pb); err != nil {
			continue
		}
		count++
	}

	// If source has no overrides, copy base products
	if count == 0 {
		var products []models.Product
		if err := h.productBranchRepo.GetDB().WithContext(r.Context()).Find(&products).Error; err == nil {
			for _, p := range products {
				pb := &models.ProductBranch{
					BranchID:   uint(targetID),
					ProductID:  p.ID,
					Price:      p.Price,
					CostPrice:  p.CostPrice,
					Stock:      p.Stock,
					TrackStock: p.TrackStock,
				}
				h.productBranchRepo.Upsert(r.Context(), pb)
				count++
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": fmt.Sprintf("%d produk berhasil disalin", count),
		"count":   count,
	})
}

func (h *BranchHandler) Delete(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	if user == nil || user.Role != "owner" {
		models.WriteError(w, models.NewAPIError(models.ErrForbidden, "Hanya owner yang dapat menghapus cabang", 403))
		return
	}
	id, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	if err := h.svc.Delete(r.Context(), uint(id)); err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Cabang berhasil dihapus"})
}

func (h *BranchHandler) SetProductPrice(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	if user == nil || user.Role != "owner" {
		models.WriteError(w, models.NewAPIError(models.ErrForbidden, "Hanya owner yang dapat mengatur harga per cabang", 403))
		return
	}
	branchID, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	var req models.SetProductBranchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400))
		return
	}
	productID, _ := strconv.ParseUint(r.URL.Query().Get("product_id"), 10, 32)
	if productID == 0 {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "product_id diperlukan", 400))
		return
	}
	pb := &models.ProductBranch{
		BranchID:   uint(branchID),
		ProductID:  uint(productID),
		Price:      req.Price,
		CostPrice:  req.CostPrice,
		Stock:      req.Stock,
		TrackStock: req.TrackStock,
	}
	if err := h.productBranchRepo.Upsert(r.Context(), pb); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInternalError, "Gagal menyimpan harga cabang", 500))
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pb)
}

func (h *BranchHandler) GetProductPrices(w http.ResponseWriter, r *http.Request) {
	branchID, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	list, err := h.productBranchRepo.GetByBranch(r.Context(), uint(branchID))
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}
