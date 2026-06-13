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

type ProductHandler struct {
	service services.ProductService
}

func NewProductHandler(service services.ProductService) *ProductHandler {
	return &ProductHandler{service: service}
}

func (h *ProductHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	bidStr := r.URL.Query().Get("branch_id")
	if bidStr != "" {
		branchID, err := strconv.Atoi(bidStr)
		if err != nil || branchID <= 0 {
			models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "branch_id tidak valid", 400))
			return
		}
		products, err := h.service.GetAllByBranch(r.Context(), uint(branchID))
		if err != nil {
			models.WriteError(w, err)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(products)
		return
	}

	var branchID *uint
	if user := middleware.GetUser(r); user != nil {
		branchID = user.BranchID
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	search := strings.TrimSpace(r.URL.Query().Get("search"))
	category := strings.TrimSpace(r.URL.Query().Get("category"))

	if page > 0 && limit > 0 {
		products, total, err := h.service.GetAllProductsPaginated(r.Context(), page, limit, search, category, branchID)
		if err != nil {
			models.WriteError(w, err)
			return
		}
		totalPages := int(total) / limit
		if int(total)%limit > 0 {
			totalPages++
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"data": products,
			"pagination": models.Pagination{
				Page:       page,
				Limit:      limit,
				TotalItems: int(total),
				TotalPages: totalPages,
			},
		})
		return
	}

	products, err := h.service.GetAllProducts(r.Context())
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(products)
}

func (h *ProductHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "ID produk tidak valid", 400))
		return
	}

	product, err := h.service.GetProductByID(r.Context(), uint(id))
	if err != nil {
		models.WriteError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(product)
}

func (h *ProductHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format input tidak valid", 400))
		return
	}

	if req.BranchID == nil {
		if user := middleware.GetUser(r); user != nil {
			req.BranchID = user.BranchID
		}
	}

	product, err := h.service.CreateProduct(r.Context(), &req)
	if err != nil {
		models.WriteError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(product)
}

func (h *ProductHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "ID produk tidak valid", 400))
		return
	}

	var req models.UpdateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format input tidak valid", 400))
		return
	}

	product, err := h.service.UpdateProduct(r.Context(), uint(id), &req)
	if err != nil {
		models.WriteError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(product)
}

func (h *ProductHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "ID produk tidak valid", 400))
		return
	}

	err = h.service.DeleteProduct(r.Context(), uint(id))
	if err != nil {
		models.WriteError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Produk berhasil dihapus",
	})
}
