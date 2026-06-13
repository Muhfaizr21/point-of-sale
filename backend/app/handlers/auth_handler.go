package handlers

import (
	"encoding/json"
	"net/http"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/services"
	"strconv"
)

type AuthHandler struct {
	svc services.AuthService
}

func NewAuthHandler(svc services.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400))
		return
	}

	resp, err := h.svc.Login(r.Context(), req.Username, req.Password)
	if err != nil {
		models.WriteError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	token := extractToken(r)
	if token == "" {
		models.WriteError(w, models.NewAPIError(models.ErrUnauthorized, "Token diperlukan", 401))
		return
	}

	user, err := h.svc.Me(r.Context(), token)
	if err != nil {
		models.WriteError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	token := extractToken(r)
	h.svc.Logout(r.Context(), token)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Berhasil logout"})
}

func (h *AuthHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	users, err := h.svc.GetAllUsers(r.Context())
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func (h *AuthHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Name     string `json:"name"`
		Role     string `json:"role"`
		BranchID *uint  `json:"branch_id,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400))
		return
	}

	user, err := h.svc.CreateUser(r.Context(), req.Username, req.Password, req.Name, req.Role, req.BranchID)
	if err != nil {
		models.WriteError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseUint(r.PathValue("id"), 10, 32)
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "ID tidak valid", 400))
		return
	}

	var req struct {
		Username string `json:"username"`
		Password string `json:"password,omitempty"`
		Name     string `json:"name"`
		Role     string `json:"role"`
		BranchID *uint  `json:"branch_id,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400))
		return
	}

	user, err := h.svc.UpdateUser(r.Context(), uint(id), req.Username, req.Password, req.Name, req.Role, req.BranchID)
	if err != nil {
		models.WriteError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseUint(r.PathValue("id"), 10, 32)
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "ID tidak valid", 400))
		return
	}

	if err := h.svc.DeleteUser(r.Context(), uint(id)); err != nil {
		models.WriteError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "User berhasil dihapus"})
}

func extractToken(r *http.Request) string {
	token := r.Header.Get("Authorization")
	if len(token) > 7 && token[:7] == "Bearer " {
		return token[7:]
	}
	return ""
}
