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

type CustomerHandler struct {
	svc services.CustomerService
}

func NewCustomerHandler(svc services.CustomerService) *CustomerHandler {
	return &CustomerHandler{svc: svc}
}

func (h *CustomerHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	search := strings.TrimSpace(r.URL.Query().Get("search"))

	// TODO: pass merchantID from getMerchantID(r) once CustomerService.GetAll/GetAllPaginated support merchant_id filter
	if page > 0 && limit > 0 {
		list, total, err := h.svc.GetAllPaginated(r.Context(), page, limit, search)
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

	list, err := h.svc.GetAll(r.Context())
	if err != nil { models.WriteError(w, err); return }
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

func (h *CustomerHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	c, err := h.svc.GetByID(r.Context(), uint(id))
	if err != nil { models.WriteError(w, err); return }
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(c)
}

func (h *CustomerHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateCustomerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400))
		return
	}
	if req.MerchantID == nil {
		if user := middleware.GetUser(r); user != nil {
			req.MerchantID = user.MerchantID
		}
	}
	c, err := h.svc.Create(r.Context(), &req)
	if err != nil { models.WriteError(w, err); return }
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(c)
}

func (h *CustomerHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	var req models.UpdateCustomerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400))
		return
	}
	c, err := h.svc.Update(r.Context(), uint(id), &req)
	if err != nil { models.WriteError(w, err); return }
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(c)
}

func (h *CustomerHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	if err := h.svc.Delete(r.Context(), uint(id)); err != nil {
		models.WriteError(w, err); return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Pelanggan berhasil dihapus"})
}

func (h *CustomerHandler) GetOrders(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	var branchID *uint
	if user := middleware.GetUser(r); user != nil {
		branchID = user.BranchID
	}
	orders, err := h.svc.GetOrders(r.Context(), uint(id), branchID)
	if err != nil { models.WriteError(w, err); return }
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}
