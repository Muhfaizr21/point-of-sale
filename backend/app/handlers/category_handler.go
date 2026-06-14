package handlers

import (
	"encoding/json"
	"net/http"
	"point-of-sale/backend/app/middleware"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/services"
	"strconv"
)

type CategoryHandler struct {
	service services.CategoryService
}

func NewCategoryHandler(service services.CategoryService) *CategoryHandler {
	return &CategoryHandler{service: service}
}

func (h *CategoryHandler) GetAll(w http.ResponseWriter, r *http.Request) {
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
	categories, err := h.service.GetAllCategories(r.Context(), branchID, merchantID)
	if err != nil {
		models.WriteError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(categories)
}

func (h *CategoryHandler) Create(w http.ResponseWriter, r *http.Request) {
	var category models.Category
	if err := json.NewDecoder(r.Body).Decode(&category); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Invalid request payload", 400))
		return
	}

	if category.BranchID == nil {
		if bid := r.URL.Query().Get("branch_id"); bid != "" {
			if id, err := strconv.ParseUint(bid, 10, 32); err == nil {
				uid := uint(id)
				category.BranchID = &uid
			}
		}
	}
	if category.BranchID == nil {
		if user := middleware.GetUser(r); user != nil {
			category.BranchID = user.BranchID
		}
	}
	if category.MerchantID == nil {
		if user := middleware.GetUser(r); user != nil {
			category.MerchantID = user.MerchantID
		}
	}

	if err := h.service.CreateCategory(r.Context(), &category); err != nil {
		models.WriteError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(category)
}

func (h *CategoryHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Invalid ID", 400))
		return
	}

	existing, err := h.service.GetCategoryByID(r.Context(), uint(id))
	if err != nil {
		models.WriteError(w, err)
		return
	}
	if user := middleware.GetUser(r); user != nil && user.BranchID != nil && existing.BranchID != nil && *existing.BranchID != *user.BranchID {
		models.WriteError(w, models.NewAPIError(models.ErrForbidden, "Data ini bukan milik cabang Anda", 403))
		return
	}

	var category models.Category
	if err := json.NewDecoder(r.Body).Decode(&category); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Invalid request payload", 400))
		return
	}
	category.ID = uint(id)

	if err := h.service.UpdateCategory(r.Context(), &category); err != nil {
		models.WriteError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(category)
}

func (h *CategoryHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Invalid ID", 400))
		return
	}

	existing, err := h.service.GetCategoryByID(r.Context(), uint(id))
	if err != nil {
		models.WriteError(w, err)
		return
	}
	if user := middleware.GetUser(r); user != nil && user.BranchID != nil && existing.BranchID != nil && *existing.BranchID != *user.BranchID {
		models.WriteError(w, models.NewAPIError(models.ErrForbidden, "Data ini bukan milik cabang Anda", 403))
		return
	}

	merchantID := getMerchantID(r)
	if err := h.service.DeleteCategory(r.Context(), uint(id), merchantID); err != nil {
		models.WriteError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
