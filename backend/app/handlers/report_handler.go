package handlers

import (
	"encoding/json"
	"net/http"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/services"
	"strings"
)

type ReportHandler struct {
	service services.ReportService
}

func NewReportHandler(service services.ReportService) *ReportHandler {
	return &ReportHandler{service: service}
}

func (h *ReportHandler) GetStockReport(w http.ResponseWriter, r *http.Request) {
	result, err := h.service.GetStockReport(r.Context())
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInternalError, "Gagal mengambil laporan stok", 500))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (h *ReportHandler) GetCustomerReport(w http.ResponseWriter, r *http.Request) {
	dateFrom := strings.TrimSpace(r.URL.Query().Get("date_from"))
	dateTo := strings.TrimSpace(r.URL.Query().Get("date_to"))

	result, err := h.service.GetCustomerReport(r.Context(), dateFrom, dateTo)
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInternalError, "Gagal mengambil laporan pelanggan", 500))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (h *ReportHandler) GetProfitLoss(w http.ResponseWriter, r *http.Request) {
	dateFrom := strings.TrimSpace(r.URL.Query().Get("date_from"))
	dateTo := strings.TrimSpace(r.URL.Query().Get("date_to"))

	result, err := h.service.GetProfitLoss(r.Context(), dateFrom, dateTo)
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInternalError, "Gagal mengambil laporan laba-rugi", 500))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}
