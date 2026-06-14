package handlers

import (
	"encoding/json"
	"net/http"
	"point-of-sale/backend/app/middleware"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/services"
	"strconv"
)

type ExpenseHandler struct {
	svc services.ExpenseService
}

func NewExpenseHandler(svc services.ExpenseService) *ExpenseHandler {
	return &ExpenseHandler{svc: svc}
}

func (h *ExpenseHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	limit, _ := strconv.Atoi(q.Get("limit"))
	var branchID *uint
	if bid := q.Get("branch_id"); bid != "" {
		if id, err := strconv.ParseUint(bid, 10, 32); err == nil {
			uid := uint(id)
			branchID = &uid
		}
	} else if user := middleware.GetUser(r); user != nil && user.BranchID != nil {
		branchID = user.BranchID
	}
	merchantID := getMerchantID(r)
	query := &models.ExpenseQuery{
		DateFrom:  q.Get("date_from"),
		DateTo:    q.Get("date_to"),
		Category:  q.Get("category"),
		Search:    q.Get("search"),
		Page:      page,
		Limit:     limit,
		SortBy:    q.Get("sort_by"),
		SortOrder: q.Get("sort_order"),
		BranchID:  branchID,
	}
	result, err := h.svc.GetFiltered(r.Context(), query, merchantID)
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (h *ExpenseHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	e, err := h.svc.GetByID(r.Context(), uint(id))
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(e)
}

func (h *ExpenseHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateExpenseRequest
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
		if user := middleware.GetUser(r); user != nil && user.BranchID != nil {
			req.BranchID = user.BranchID
		}
	}
	if req.MerchantID == nil {
		if user := middleware.GetUser(r); user != nil {
			req.MerchantID = user.MerchantID
		}
	}
	e, err := h.svc.Create(r.Context(), &req)
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(e)
}

func (h *ExpenseHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	existing, err := h.svc.GetByID(r.Context(), uint(id))
	if err != nil {
		models.WriteError(w, err)
		return
	}
	if user := middleware.GetUser(r); user != nil && user.BranchID != nil {
		if existing.BranchID == nil || *existing.BranchID != *user.BranchID {
			models.WriteError(w, models.NewAPIError(models.ErrForbidden, "Anda tidak memiliki izin untuk mengubah pengeluaran ini", 403))
			return
		}
	}
	var req models.UpdateExpenseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400))
		return
	}
	e, err := h.svc.Update(r.Context(), uint(id), &req)
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(e)
}

func (h *ExpenseHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	existing, err := h.svc.GetByID(r.Context(), uint(id))
	if err != nil {
		models.WriteError(w, err)
		return
	}
	if user := middleware.GetUser(r); user != nil && user.BranchID != nil {
		if existing.BranchID == nil || *existing.BranchID != *user.BranchID {
			models.WriteError(w, models.NewAPIError(models.ErrForbidden, "Anda tidak memiliki izin untuk menghapus pengeluaran ini", 403))
			return
		}
	}
	if err := h.svc.Delete(r.Context(), uint(id)); err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Pengeluaran berhasil dihapus"})
}
