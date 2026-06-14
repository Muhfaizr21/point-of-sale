package handlers

import (
	"encoding/json"
	"net/http"
	"point-of-sale/backend/app/middleware"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/services"
	"strconv"
)

type SubscriptionHandler struct {
	svc services.SubscriptionService
}

func NewSubscriptionHandler(svc services.SubscriptionService) *SubscriptionHandler {
	return &SubscriptionHandler{svc: svc}
}

func (h *SubscriptionHandler) GetPlans(w http.ResponseWriter, r *http.Request) {
	plans, err := h.svc.GetAllPlans(r.Context())
	if err != nil { models.WriteError(w, err); return }
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(plans)
}

func (h *SubscriptionHandler) CreatePlan(w http.ResponseWriter, r *http.Request) {
	if user := middleware.GetUser(r); user == nil || user.Role != "superadmin" {
		models.WriteError(w, models.NewAPIError(models.ErrForbidden, "Hanya superadmin", 403)); return
	}
	var req models.CreatePlanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400)); return
	}
	plan, err := h.svc.CreatePlan(r.Context(), &req)
	if err != nil { models.WriteError(w, err); return }
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(plan)
}

func (h *SubscriptionHandler) UpdatePlan(w http.ResponseWriter, r *http.Request) {
	if user := middleware.GetUser(r); user == nil || user.Role != "superadmin" {
		models.WriteError(w, models.NewAPIError(models.ErrForbidden, "Hanya superadmin", 403)); return
	}
	id, _ := strconv.ParseUint(r.PathValue("id"), 10, 32)
	var req models.CreatePlanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400)); return
	}
	plan, err := h.svc.UpdatePlan(r.Context(), uint(id), &req)
	if err != nil { models.WriteError(w, err); return }
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(plan)
}

func (h *SubscriptionHandler) GetSubscriptions(w http.ResponseWriter, r *http.Request) {
	if user := middleware.GetUser(r); user == nil || user.Role != "superadmin" {
		models.WriteError(w, models.NewAPIError(models.ErrForbidden, "Hanya superadmin", 403)); return
	}
	list, err := h.svc.GetAllSubscriptions(r.Context())
	if err != nil { models.WriteError(w, err); return }
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

func (h *SubscriptionHandler) GetMySubscription(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	if user == nil || user.MerchantID == nil {
		models.WriteError(w, models.NewAPIError(models.ErrNotFound, "Tidak ada langganan", 404)); return
	}
	sub, err := h.svc.GetSubscriptionByMerchant(r.Context(), *user.MerchantID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"plan": nil, "status": "none"})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sub)
}

func (h *SubscriptionHandler) Assign(w http.ResponseWriter, r *http.Request) {
	if user := middleware.GetUser(r); user == nil || user.Role != "superadmin" {
		models.WriteError(w, models.NewAPIError(models.ErrForbidden, "Hanya superadmin", 403)); return
	}
	var req models.AssignSubscriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400)); return
	}
	sub, err := h.svc.AssignSubscription(r.Context(), &req)
	if err != nil { models.WriteError(w, err); return }
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sub)
}
