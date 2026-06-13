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

type OrderHandler struct {
	service services.OrderService
}

func NewOrderHandler(service services.OrderService) *OrderHandler {
	return &OrderHandler{service: service}
}

func (h *OrderHandler) Checkout(w http.ResponseWriter, r *http.Request) {
	var req models.CreateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format transaksi tidak valid", 400))
		return
	}

	// #3: Get cashier name + branch_id from authenticated user
	cashierName := "Admin"
	if user := middleware.GetUser(r); user != nil {
		cashierName = user.Name
		// User branch_id takes precedence; fallback to request payload (admin scoped)
		if user.BranchID != nil {
			req.BranchID = user.BranchID
		}
	}

	order, err := h.service.Checkout(r.Context(), &req, cashierName)
	if err != nil {
		models.WriteError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(order)
}

func (h *OrderHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	// Parse query params for filtering
	query := &models.OrderQuery{
		Page:    1,
		Limit:   10,
		SortBy:  "created_at",
		SortOrder: "desc",
	}

	// Parse page
	if page := r.URL.Query().Get("page"); page != "" {
		if p, err := strconv.Atoi(page); err == nil {
			query.Page = p
		}
	}

	// Parse limit
	if limit := r.URL.Query().Get("limit"); limit != "" {
		if l, err := strconv.Atoi(limit); err == nil && l > 0 {
			query.Limit = l
		}
	}

	// Parse search
	if search := r.URL.Query().Get("search"); search != "" {
		query.Search = strings.TrimSpace(search)
	}

	// Parse payment_method
	if pm := r.URL.Query().Get("payment_method"); pm != "" {
		query.PaymentMethod = strings.ToUpper(pm)
	}

	// Parse status
	if status := r.URL.Query().Get("status"); status != "" {
		query.Status = strings.ToUpper(status)
	}

	// Parse date_from
	if df := r.URL.Query().Get("date_from"); df != "" {
		query.DateFrom = df
	}

	// Parse date_to
	if dt := r.URL.Query().Get("date_to"); dt != "" {
		query.DateTo = dt
	}

	// Parse sort_by
	if sb := r.URL.Query().Get("sort_by"); sb != "" {
		query.SortBy = sb
	}

	// Parse sort_order
	if so := r.URL.Query().Get("sort_order"); so != "" {
		query.SortOrder = strings.ToLower(so)
	}

	// Parse branch_id — auto-scope from user context or explicit param
	if bid := r.URL.Query().Get("branch_id"); bid != "" {
		if id, err := strconv.ParseUint(bid, 10, 32); err == nil {
			uid := uint(id)
			query.BranchID = &uid
		}
	} else if user := middleware.GetUser(r); user != nil && user.BranchID != nil {
		query.BranchID = user.BranchID
	}

	result, err := h.service.GetFilteredOrders(r.Context(), query)
	if err != nil {
		models.WriteError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

func (h *OrderHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseUint(r.PathValue("id"), 10, 32)
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "ID pesanan tidak valid", 400))
		return
	}

	order, err := h.service.GetOrderByID(r.Context(), uint(id))
	if err != nil {
		models.WriteError(w, err)
		return
	}

	if order == nil {
		models.WriteError(w, models.NewAPIError(models.ErrNotFound, "Pesanan tidak ditemukan", 404))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(order)
}

// #16: Refund — reverse stock + mark REFUND
func (h *OrderHandler) Refund(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseUint(r.PathValue("id"), 10, 32)
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "ID pesanan tidak valid", 400))
		return
	}

	var req models.RefundOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format data tidak valid", 400))
		return
	}

	order, err := h.service.RefundOrder(r.Context(), uint(id), &req)
	if err != nil {
		models.WriteError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(order)
}

func (h *OrderHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseUint(r.PathValue("id"), 10, 32)
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "ID pesanan tidak valid", 400))
		return
	}

	var req models.UpdateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format data tidak valid", 400))
		return
	}

	order, err := h.service.UpdateOrder(r.Context(), uint(id), &req)
	if err != nil {
		models.WriteError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(order)
}
