package handlers

import (
	"encoding/json"
	"net/http"
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
