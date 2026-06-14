package handlers

import (
	"encoding/json"
	"net/http"
	"point-of-sale/backend/app/middleware"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/services"
	"strconv"
)

type SuperadminHandler struct {
	svc services.SuperadminService
}

func NewSuperadminHandler(svc services.SuperadminService) *SuperadminHandler {
	return &SuperadminHandler{svc: svc}
}

func (h *SuperadminHandler) GetRevenueDashboard(w http.ResponseWriter, r *http.Request) {
	stats, monthly, err := h.svc.GetRevenueDashboard(r.Context())
	if err != nil { http.Error(w, `{"error":"`+err.Error()+`"}`, 500); return }
	json.NewEncoder(w).Encode(map[string]interface{}{"stats": stats, "monthly": monthly})
}

func (h *SuperadminHandler) GetAllOrders(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if page < 1 { page = 1 }
	if limit < 1 || limit > 100 { limit = 20 }
	merchantID, _ := strconv.ParseUint(r.URL.Query().Get("merchant_id"), 10, 32)
	list, total, err := h.svc.GetAllOrders(r.Context(), page, limit, uint(merchantID), r.URL.Query().Get("status"), r.URL.Query().Get("date_from"), r.URL.Query().Get("date_to"))
	if err != nil { http.Error(w, `{"error":"`+err.Error()+`"}`, 500); return }
	tp := int(total) / limit; if int(total)%limit > 0 { tp++ }
	json.NewEncoder(w).Encode(map[string]interface{}{"data": list, "total": total, "page": page, "limit": limit, "total_pages": tp})
}

func (h *SuperadminHandler) GetRevenuePerMerchant(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if page < 1 { page = 1 }
	if limit < 1 || limit > 100 { limit = 20 }
	list, total, err := h.svc.GetRevenuePerMerchant(r.Context(), page, limit)
	if err != nil { http.Error(w, `{"error":"`+err.Error()+`"}`, 500); return }
	json.NewEncoder(w).Encode(map[string]interface{}{"data": list, "total": total, "page": page, "limit": limit})
}

func (h *SuperadminHandler) GetOrderStats(w http.ResponseWriter, r *http.Request) {
	s, e := h.svc.GetOrderStats(r.Context())
	if e != nil { http.Error(w, `{"error":"`+e.Error()+`"}`, 500); return }
	json.NewEncoder(w).Encode(s)
}

func (h *SuperadminHandler) GetPaymentStats(w http.ResponseWriter, r *http.Request) {
	s, e := h.svc.GetPaymentStats(r.Context())
	if e != nil { http.Error(w, `{"error":"`+e.Error()+`"}`, 500); return }
	json.NewEncoder(w).Encode(s)
}

func (h *SuperadminHandler) GetPaymentTransactions(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if page < 1 { page = 1 }; if limit < 1 || limit > 100 { limit = 20 }
	list, total, err := h.svc.GetPaymentTransactions(r.Context(), page, limit, r.URL.Query().Get("status"))
	if err != nil { http.Error(w, `{"error":"`+err.Error()+`"}`, 500); return }
	tp := int(total) / limit; if int(total)%limit > 0 { tp++ }
	json.NewEncoder(w).Encode(map[string]interface{}{"data": list, "total": total, "page": page, "limit": limit, "total_pages": tp})
}

func (h *SuperadminHandler) GetSystemHealth(w http.ResponseWriter, r *http.Request) {
	s, e := h.svc.GetSystemHealth(r.Context())
	if e != nil { http.Error(w, `{"error":"`+e.Error()+`"}`, 500); return }
	json.NewEncoder(w).Encode(s)
}

// Audit Logs
func (h *SuperadminHandler) GetAuditLogs(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if page < 1 { page = 1 }; if limit < 1 || limit > 100 { limit = 30 }
	list, total, err := h.svc.GetAuditLogs(r.Context(), page, limit, r.URL.Query().Get("action"), r.URL.Query().Get("user_id"))
	if err != nil { http.Error(w, `{"error":"`+err.Error()+`"}`, 500); return }
	tp := int(total) / limit; if int(total)%limit > 0 { tp++ }
	json.NewEncoder(w).Encode(map[string]interface{}{"data": list, "total": total, "page": page, "limit": limit, "total_pages": tp})
}

// Platform Settings
func (h *SuperadminHandler) GetPlatformSettings(w http.ResponseWriter, r *http.Request) {
	s, e := h.svc.GetPlatformSettings(r.Context())
	if e != nil { http.Error(w, `{"error":"`+e.Error()+`"}`, 500); return }
	json.NewEncoder(w).Encode(s)
}

func (h *SuperadminHandler) UpdatePlatformSetting(w http.ResponseWriter, r *http.Request) {
	var body struct { Key string `json:"key"`; Value string `json:"value"` }
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil { models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400)); return }
	if body.Key == "" { models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Key wajib diisi", 400)); return }
	if err := h.svc.UpsertPlatformSetting(r.Context(), body.Key, body.Value); err != nil { http.Error(w, `{"error":"`+err.Error()+`"}`, 500); return }
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// Maintenance Mode
func (h *SuperadminHandler) SetMaintenanceMode(w http.ResponseWriter, r *http.Request) {
	var body struct { Enabled bool `json:"enabled"`; Message string `json:"message"` }
	json.NewDecoder(r.Body).Decode(&body)
	enabled := "false"; if body.Enabled { enabled = "true" }
	h.svc.UpsertPlatformSetting(r.Context(), "maintenance_mode", enabled)
	h.svc.UpsertPlatformSetting(r.Context(), "maintenance_message", body.Message)
	json.NewEncoder(w).Encode(map[string]interface{}{"maintenance_mode": body.Enabled, "maintenance_message": body.Message})
}

func (h *SuperadminHandler) GetMaintenanceStatus(w http.ResponseWriter, r *http.Request) {
	s, _ := h.svc.GetPlatformSettings(r.Context())
	enabled := s["maintenance_mode"] == "true"
	json.NewEncoder(w).Encode(map[string]interface{}{
		"maintenance_mode": enabled,
		"maintenance_message": s["maintenance_message"],
	})
}

// Contact Messages
func (h *SuperadminHandler) GetContactMessages(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if page < 1 { page = 1 }; if limit < 1 || limit > 100 { limit = 20 }
	list, total, err := h.svc.GetContactMessages(r.Context(), page, limit, r.URL.Query().Get("status"))
	if err != nil { http.Error(w, `{"error":"`+err.Error()+`"}`, 500); return }
	tp := int(total) / limit; if int(total)%limit > 0 { tp++ }
	json.NewEncoder(w).Encode(map[string]interface{}{"data": list, "total": total, "page": page, "limit": limit, "total_pages": tp})
}

func (h *SuperadminHandler) MarkContactRead(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	user := middleware.GetUser(r)
	if user == nil { models.WriteError(w, models.NewAPIError(models.ErrUnauthorized, "Silakan login", 401)); return }
	if err := h.svc.MarkContactRead(r.Context(), uint(id), user.ID); err != nil { http.Error(w, `{"error":"`+err.Error()+`"}`, 500); return }
	json.NewEncoder(w).Encode(map[string]string{"status": "read"})
}

func (h *SuperadminHandler) DeleteContactMessage(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	if err := h.svc.DeleteContactMessage(r.Context(), uint(id)); err != nil { http.Error(w, `{"error":"`+err.Error()+`"}`, 500); return }
	json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
}

func (h *SuperadminHandler) CreateContactMessage(w http.ResponseWriter, r *http.Request) {
	var msg models.ContactMessage
	if err := json.NewDecoder(r.Body).Decode(&msg); err != nil { models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400)); return }
	if msg.Name == "" || msg.Subject == "" || msg.Message == "" {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Nama, subjek, dan pesan wajib diisi", 400)); return
	}
	if err := h.svc.CreateContactMessage(r.Context(), &msg); err != nil { http.Error(w, `{"error":"`+err.Error()+`"}`, 500); return }
	json.NewEncoder(w).Encode(map[string]string{"status": "sent"})
}

// Ticket endpoints
func (h *SuperadminHandler) GetExportData(w http.ResponseWriter, r *http.Request) {
	d, err := h.svc.GetExportData(r.Context(), r.URL.Query().Get("date_from"), r.URL.Query().Get("date_to"))
	if err != nil { http.Error(w, `{"error":"`+err.Error()+`"}`, 500); return }
	json.NewEncoder(w).Encode(d)
}

func (h *SuperadminHandler) GetDemographics(w http.ResponseWriter, r *http.Request) {
	d, err := h.svc.GetDemographics(r.Context())
	if err != nil { http.Error(w, `{"error":"`+err.Error()+`"}`, 500); return }
	json.NewEncoder(w).Encode(d)
}

func (h *SuperadminHandler) GetTickets(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if page < 1 { page = 1 }; if limit < 1 || limit > 100 { limit = 20 }
	list, total, err := h.svc.GetTickets(r.Context(), page, limit, r.URL.Query().Get("status"))
	if err != nil { http.Error(w, `{"error":"`+err.Error()+`"}`, 500); return }
	tp := int(total) / limit; if int(total)%limit > 0 { tp++ }
	json.NewEncoder(w).Encode(map[string]interface{}{"data": list, "total": total, "page": page, "limit": limit, "total_pages": tp})
}

func (h *SuperadminHandler) GetTicketDetail(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	t, err := h.svc.GetTicketByID(r.Context(), uint(id))
	if err != nil { models.WriteError(w, models.NewAPIError(models.ErrNotFound, "Ticket tidak ditemukan", 404)); return }
	json.NewEncoder(w).Encode(t)
}

func (h *SuperadminHandler) ReplyTicket(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	user := middleware.GetUser(r)
	var req models.ReplyTicketRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil { models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400)); return }
	if req.Message == "" { models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Pesan wajib diisi", 400)); return }
	senderName := "Support"
	if user != nil { senderName = user.Name }
	m, err := h.svc.ReplyTicket(r.Context(), uint(id), senderName, &req)
	if err != nil { http.Error(w, `{"error":"`+err.Error()+`"}`, 500); return }
	json.NewEncoder(w).Encode(m)
}

func (h *SuperadminHandler) CreateTicket(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	merchantID := uint(0); userID := uint(0)
	if user != nil { userID = user.ID; if user.MerchantID != nil { merchantID = *user.MerchantID } }
	var req models.CreateTicketRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil { models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400)); return }
	if req.Message == "" { models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Pesan wajib diisi", 400)); return }
	if req.Name == "" && user != nil { req.Name = user.Name }
	t, err := h.svc.CreateTicket(r.Context(), userID, merchantID, &req)
	if err != nil { http.Error(w, `{"error":"`+err.Error()+`"}`, 500); return }
	json.NewEncoder(w).Encode(t)
}

func (h *SuperadminHandler) GetMyTickets(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	if user == nil { json.NewEncoder(w).Encode([]models.Ticket{}); return }
	merchantID := uint(0); if user.MerchantID != nil { merchantID = *user.MerchantID }
	list, err := h.svc.GetMyTickets(r.Context(), user.ID, merchantID)
	if err != nil { json.NewEncoder(w).Encode([]models.Ticket{}); return }
	json.NewEncoder(w).Encode(list)
}

func (h *SuperadminHandler) CloseTicket(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	if err := h.svc.UpdateTicketStatus(r.Context(), uint(id), "closed"); err != nil { http.Error(w, `{"error":"`+err.Error()+`"}`, 500); return }
	json.NewEncoder(w).Encode(map[string]string{"status": "closed"})
}

// Merchant-facing ticket endpoints
func (h *SuperadminHandler) GetMyTicketDetail(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	t, err := h.svc.GetTicketByID(r.Context(), uint(id))
	if err != nil { models.WriteError(w, models.NewAPIError(models.ErrNotFound, "Ticket tidak ditemukan", 404)); return }
	json.NewEncoder(w).Encode(t)
}

func (h *SuperadminHandler) ReplyMyTicket(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	user := middleware.GetUser(r)
	senderName := "Merchant"; if user != nil && user.Name != "" { senderName = user.Name }
	var req models.ReplyTicketRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil { models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400)); return }
	if req.Message == "" { models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Pesan wajib diisi", 400)); return }
	m, err := h.svc.ReplyTicketAs(r.Context(), uint(id), "merchant", senderName, &req)
	if err != nil { http.Error(w, `{"error":"`+err.Error()+`"}`, 500); return }
	json.NewEncoder(w).Encode(m)
}

func (h *SuperadminHandler) CloseMyTicket(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	if err := h.svc.UpdateTicketStatus(r.Context(), uint(id), "closed"); err != nil { http.Error(w, `{"error":"`+err.Error()+`"}`, 500); return }
	json.NewEncoder(w).Encode(map[string]string{"status": "closed"})
}
