package handlers

import (
	"encoding/json"
	"net/http"
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

	order, err := h.service.Checkout(r.Context(), &req)
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
	// Extract ID from path - simplified without gorilla/mux
	path := r.URL.Path
	idStr := strings.TrimPrefix(path, "/api/orders/")
	idStr = strings.TrimPrefix(idStr, "/")

	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Invalid order ID", 400))
		return
	}

	order, err := h.service.GetOrderByID(r.Context(), uint(id))
	if err != nil {
		models.WriteError(w, err)
		return
	}

	if order == nil {
		models.WriteError(w, models.NewAPIError(models.ErrNotFound, "Order not found", 404))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(order)
}
