package handlers

import (
	"encoding/json"
	"net/http"
	"point-of-sale/backend/app/middleware"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/services"
	"strconv"
)

type BroadcastHandler struct {
	svc services.BroadcastService
}

func NewBroadcastHandler(svc services.BroadcastService) *BroadcastHandler {
	return &BroadcastHandler{svc: svc}
}

func (h *BroadcastHandler) Create(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	if user == nil || user.Role != "superadmin" {
		models.WriteError(w, models.NewAPIError(models.ErrForbidden, "Hanya superadmin", 403)); return
	}
	var req models.CreateBroadcastRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400)); return
	}
	b, err := h.svc.Create(r.Context(), &req, user.ID)
	if err != nil { models.WriteError(w, err); return }
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(b)
}

func (h *BroadcastHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if page < 1 { page = 1 }
	if limit < 1 || limit > 100 { limit = 10 }

	list, total, err := h.svc.GetAll(r.Context(), page, limit)
	if err != nil { models.WriteError(w, err); return }
	totalPages := int(total) / limit
	if int(total)%limit > 0 { totalPages++ }
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data":        list,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": totalPages,
	})
}

func (h *BroadcastHandler) GetUnread(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	if user == nil || user.MerchantID == nil {
		json.NewEncoder(w).Encode([]models.Broadcast{})
		return
	}
	list, err := h.svc.GetUnread(r.Context(), *user.MerchantID)
	if err != nil { json.NewEncoder(w).Encode([]models.Broadcast{}); return }
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

func (h *BroadcastHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, _ := strconv.ParseUint(idStr, 10, 32)
	if id == 0 {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "ID tidak valid", 400)); return
	}
	if err := h.svc.Delete(r.Context(), uint(id)); err != nil {
		models.WriteError(w, err); return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Pengumuman berhasil dihapus"})
}

func (h *BroadcastHandler) MarkRead(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	if user == nil || user.MerchantID == nil {
		models.WriteError(w, models.NewAPIError(models.ErrUnauthorized, "Silakan login", 401)); return
	}
	idStr := r.PathValue("id")
	id, _ := strconv.ParseUint(idStr, 10, 32)
	if err := h.svc.MarkRead(r.Context(), uint(id), *user.MerchantID); err != nil {
		models.WriteError(w, err); return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "read"})
}
