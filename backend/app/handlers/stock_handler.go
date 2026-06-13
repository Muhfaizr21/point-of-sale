package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"point-of-sale/backend/app/middleware"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/repositories"
	"strconv"

	"gorm.io/gorm"
)

type StockHandler struct {
	db        *gorm.DB
	prodRepo  repositories.ProductRepository
	pbRepo    repositories.ProductBranchRepository
	logRepo   repositories.StockLogRepository
}

func NewStockHandler(db *gorm.DB, prodRepo repositories.ProductRepository, pbRepo repositories.ProductBranchRepository, logRepo repositories.StockLogRepository) *StockHandler {
	return &StockHandler{db: db, prodRepo: prodRepo, pbRepo: pbRepo, logRepo: logRepo}
}

func (h *StockHandler) Adjust(w http.ResponseWriter, r *http.Request) {
	var req models.StockAdjustRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format tidak valid", 400))
		return
	}
	if req.Change == 0 {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Jumlah perubahan tidak boleh 0", 400))
		return
	}

	user := middleware.GetUser(r)
	if user != nil && user.BranchID != nil {
		// Per-branch stock adjustment
		pb, err := h.pbRepo.GetByBranchProduct(r.Context(), *user.BranchID, req.ProductID)
		if err != nil {
			models.WriteError(w, err)
			return
		}
		if pb == nil {
			// Fetch product to get TrackStock
			product, err := h.prodRepo.GetByID(r.Context(), req.ProductID)
			if err != nil {
				models.WriteError(w, err)
				return
			}
			if !product.TrackStock {
				models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Stok produk ini tidak dilacak", 400))
				return
			}
			pb = &models.ProductBranch{
				BranchID:   *user.BranchID,
				ProductID:  req.ProductID,
				Stock:      product.Stock,
				TrackStock: product.TrackStock,
			}
		}
		if !pb.TrackStock {
			models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Stok produk ini tidak dilacak", 400))
			return
		}
		newStock := pb.Stock + req.Change
		if newStock < 0 {
			models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Stok tidak boleh negatif", 400))
			return
		}
		pb.Stock = newStock
		if err := h.pbRepo.Upsert(r.Context(), pb); err != nil {
			models.WriteError(w, err)
			return
		}

		if err := h.logRepo.Create(r.Context(), &models.StockLog{
			ProductID: req.ProductID,
			Change:    req.Change,
			Remaining: newStock,
			Note:      req.Note,
		}); err != nil {
			log.Printf("⚠️  Gagal mencatat log stok: %v", err)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(pb)
		return
	}

	// Fallback: global stock adjustment
	product, err := h.prodRepo.GetByID(r.Context(), req.ProductID)
	if err != nil {
		models.WriteError(w, err)
		return
	}
	if !product.TrackStock {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Stok produk ini tidak dilacak", 400))
		return
	}

	newStock := product.Stock + req.Change
	if newStock < 0 {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Stok tidak boleh negatif", 400))
		return
	}

	product.Stock = newStock
	if err := h.prodRepo.Update(r.Context(), product); err != nil {
		models.WriteError(w, err)
		return
	}

	if err := h.logRepo.Create(r.Context(), &models.StockLog{
		ProductID: req.ProductID,
		Change:    req.Change,
		Remaining: newStock,
		Note:      req.Note,
	}); err != nil {
		log.Printf("⚠️  Gagal mencatat log stok: %v", err)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}

func (h *StockHandler) GetLogs(w http.ResponseWriter, r *http.Request) {
	productIDStr := r.URL.Query().Get("product_id")
	if productIDStr == "" {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "product_id required", 400))
		return
	}
	productID, _ := strconv.ParseUint(productIDStr, 10, 32)
	logs, err := h.logRepo.GetByProductID(r.Context(), uint(productID))
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

func (h *StockHandler) GetAllLogs(w http.ResponseWriter, r *http.Request) {
	var logs []models.StockLog
	err := h.db.WithContext(r.Context()).Preload("Product").Order("created_at desc").Limit(100).Find(&logs).Error
	if err != nil {
		models.WriteError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}
