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
	if user := middleware.GetUser(r); user != nil {
		branchID = user.BranchID
	}
	categories, err := h.service.GetAllCategories(r.Context(), branchID)
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
		if user := middleware.GetUser(r); user != nil {
			category.BranchID = user.BranchID
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

	if err := h.service.DeleteCategory(r.Context(), uint(id)); err != nil {
		models.WriteError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
