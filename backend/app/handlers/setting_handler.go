package handlers

import (
	"encoding/json"
	"net/http"
	"point-of-sale/backend/app/middleware"
	"point-of-sale/backend/app/models"
	"strings"

	"gorm.io/gorm"
)

type SettingHandler struct {
	db *gorm.DB
}

func NewSettingHandler(db *gorm.DB) *SettingHandler {
	return &SettingHandler{db: db}
}

func (h *SettingHandler) Get(w http.ResponseWriter, r *http.Request) {
	key := strings.TrimSpace(r.PathValue("key"))
	if key == "" {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Key diperlukan", 400))
		return
	}
	var s models.StoreSetting
	if err := h.db.Where("key = ?", key).First(&s).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{"key": key, "value": ""})
			return
		}
		models.WriteError(w, models.NewAPIError(models.ErrInternalError, "Gagal mengambil setting", 500))
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s)
}

func (h *SettingHandler) Upsert(w http.ResponseWriter, r *http.Request) {
	key := strings.TrimSpace(r.PathValue("key"))
	if key == "" {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Key diperlukan", 400))
		return
	}
	var req struct {
		Value string `json:"value"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400))
		return
	}
	var s models.StoreSetting
	if err := h.db.Where("key = ?", key).First(&s).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			s = models.StoreSetting{Key: key, Value: req.Value}
			h.db.Create(&s)
		} else {
			models.WriteError(w, models.NewAPIError(models.ErrInternalError, "Gagal menyimpan setting", 500))
			return
		}
	} else {
		s.Value = req.Value
		h.db.Save(&s)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s)
}

type MidtransConfigRequest struct {
	Enabled     bool   `json:"enabled"`
	ServerKey   string `json:"server_key"`
	ClientKey   string `json:"client_key"`
	MerchantID  string `json:"merchant_id"`
	Environment string `json:"environment"`
}

func (h *SettingHandler) SaveMidtransConfig(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	if user == nil || user.Role != "owner" {
		models.WriteError(w, models.NewAPIError(models.ErrForbidden, "Hanya owner yang dapat mengatur integrasi", 403))
		return
	}
	var req MidtransConfigRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400))
		return
	}
	var s models.StoreSetting
	if err := h.db.Where("key = ?", "midtrans_config").First(&s).Error; err != nil {
		s = models.StoreSetting{Key: "midtrans_config", Value: ""}
	}
	data, _ := json.Marshal(req)
	s.Value = string(data)
	if s.ID == 0 {
		h.db.Create(&s)
	} else {
		h.db.Save(&s)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"message": "Konfigurasi Midtrans berhasil disimpan", "client_key": req.ClientKey})
}

func (h *SettingHandler) GetMidtransConfig(w http.ResponseWriter, r *http.Request) {
	var s models.StoreSetting
	if err := h.db.Where("key = ?", "midtrans_config").First(&s).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"enabled": false})
		return
	}
	var cfg MidtransConfigRequest
	json.Unmarshal([]byte(s.Value), &cfg)
	user := middleware.GetUser(r)
	if user == nil || user.Role != "owner" {
		cfg.ServerKey = ""
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cfg)
}
