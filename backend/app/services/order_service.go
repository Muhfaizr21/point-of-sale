package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/repositories"
	"time"

	"gorm.io/gorm"
)

type OrderService interface {
	Checkout(ctx context.Context, req *models.CreateOrderRequest, cashierName string) (*models.Order, error)
	GetAllOrders(ctx context.Context) ([]models.Order, error)
	GetFilteredOrders(ctx context.Context, query *models.OrderQuery) (*models.OrderListResponse, error)
	GetOrderByID(ctx context.Context, id uint) (*models.Order, error)
	UpdateOrder(ctx context.Context, id uint, req *models.UpdateOrderRequest) (*models.Order, error)
	RefundOrder(ctx context.Context, id uint, req *models.RefundOrderRequest) (*models.Order, error)
}

type orderService struct {
	db          *gorm.DB
	orderRepo   repositories.OrderRepository
	productRepo repositories.ProductRepository
	bundleRepo  repositories.BundleRepository
	promoSvc    PromoService
	targetRepo  repositories.TargetRepository
}

func NewOrderService(db *gorm.DB, orderRepo repositories.OrderRepository, productRepo repositories.ProductRepository, bundleRepo repositories.BundleRepository, promoSvc PromoService, targetRepo repositories.TargetRepository) OrderService {
	return &orderService{
		db:          db,
		orderRepo:   orderRepo,
		productRepo: productRepo,
		bundleRepo:  bundleRepo,
		promoSvc:    promoSvc,
		targetRepo:  targetRepo,
	}
}

func (s *orderService) GetAllOrders(ctx context.Context) ([]models.Order, error) {
	return s.orderRepo.GetAll(ctx)
}

func (s *orderService) GetOrderByID(ctx context.Context, id uint) (*models.Order, error) {
	return s.orderRepo.GetByID(ctx, id)
}

func (s *orderService) GetFilteredOrders(ctx context.Context, query *models.OrderQuery) (*models.OrderListResponse, error) {
	if query.Page < 1 {
		query.Page = 1
	}
	if query.Limit < 1 {
		query.Limit = 10
	}
	if query.SortOrder == "" {
		query.SortOrder = "desc"
	}
	if query.SortBy == "" {
		query.SortBy = "created_at"
	}

	orders, total, err := s.orderRepo.GetFiltered(ctx, query)
	if err != nil {
		return nil, err
	}

	totalPages := int(total) / query.Limit
	if int(total)%query.Limit > 0 {
		totalPages++
	}

	return &models.OrderListResponse{
		Data: orders,
		Pagination: models.Pagination{
			Page:       query.Page,
			Limit:      query.Limit,
			TotalItems: int(total),
			TotalPages: totalPages,
		},
	}, nil
}

func (s *orderService) Checkout(ctx context.Context, req *models.CreateOrderRequest, cashierName string) (*models.Order, error) {
	if len(req.Items) == 0 && len(req.Bundles) == 0 {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Keranjang belanja tidak boleh kosong", 400)
	}

	// #14: Validate no duplicate product IDs in items
	seen := make(map[uint]bool)
	for _, item := range req.Items {
		if item.Quantity <= 0 {
			return nil, models.NewAPIError(models.ErrInvalidInput, fmt.Sprintf("Quantity produk ID %d harus > 0", item.ProductID), 400)
		}
		if seen[item.ProductID] {
			return nil, models.NewAPIError(models.ErrInvalidInput, fmt.Sprintf("Produk ID %d duplikat", item.ProductID), 400)
		}
		seen[item.ProductID] = true
	}

	// #2: Validate payment method
	if req.PaymentMethod != "" && !models.ValidPaymentMethods[req.PaymentMethod] && len(req.SplitPayments) == 0 {
		return nil, models.NewAPIError(models.ErrInvalidInput, fmt.Sprintf("Metode pembayaran %s tidak valid", req.PaymentMethod), 400)
	}

	customer := req.Customer
	if customer == "" {
		customer = "Umum"
	}
	discount := req.Discount
	if discount < 0 {
		discount = 0
	}
	// #9: Discount cap at 50% of estimated subtotal (will be rechecked after calculation)
	if cashierName == "" {
		cashierName = "Admin"
	}

	var finalOrder *models.Order

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var subtotal int
		var orderItems []models.OrderItem

		// Resolve regular items
		for _, reqItem := range req.Items {
			var product models.Product
			if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&product, reqItem.ProductID).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					return models.NewAPIError(models.ErrNotFound, fmt.Sprintf("Produk dengan ID %d tidak ditemukan", reqItem.ProductID), 404)
				}
				return err
			}

			if product.TrackStock && product.Stock < reqItem.Quantity {
				return models.NewAPIError(models.ErrOutOfStock, fmt.Sprintf("Stok produk %s tidak mencukupi (Tersedia: %d, Diminta: %d)", product.Name, product.Stock, reqItem.Quantity), 400)
			}
			if product.TrackStock {
				product.Stock -= reqItem.Quantity
				if err := tx.Save(&product).Error; err != nil {
					return err
				}
			}

			itemPrice := product.Price
			if reqItem.VariationName != "" {
				for _, v := range product.Variations {
					if v.Name == reqItem.VariationName {
						itemPrice = v.Price
						break
					}
				}
			}
			subtotal += itemPrice * reqItem.Quantity

			orderItems = append(orderItems, models.OrderItem{
				ProductID:     product.ID,
				ProductName:   product.Name,
				VariationName: reqItem.VariationName,
				Price:         itemPrice,
				CostPrice:     product.CostPrice,
				Quantity:      reqItem.Quantity,
			})
		}

		// #1: Resolve bundles — create ONE OrderItem per bundle (not per component product)
		for _, reqBundle := range req.Bundles {
			var bundle models.Bundle
			if err := tx.Preload("Items.Product").First(&bundle, reqBundle.BundleID).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					return models.NewAPIError(models.ErrNotFound, fmt.Sprintf("Bundle dengan ID %d tidak ditemukan", reqBundle.BundleID), 404)
				}
				return err
			}
			if !bundle.Active {
				return models.NewAPIError(models.ErrInvalidInput, fmt.Sprintf("Bundle %s tidak aktif", bundle.Name), 400)
			}

			subtotal += bundle.Price * reqBundle.Quantity

			// Deduct stock from component products & calc cost
			bundleCost := 0
			for _, bi := range bundle.Items {
				var product models.Product
				if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&product, bi.ProductID).Error; err != nil {
					return err
				}
				deductQty := bi.Quantity * reqBundle.Quantity
				if product.TrackStock && product.Stock < deductQty {
					return models.NewAPIError(models.ErrOutOfStock, fmt.Sprintf("Stok %s tidak cukup untuk bundle %s", product.Name, bundle.Name), 400)
				}
				if product.TrackStock {
					product.Stock -= deductQty
					if err := tx.Save(&product).Error; err != nil {
						return err
					}
				}
				bundleCost += product.CostPrice * bi.Quantity
			}

			// Single OrderItem entry for the bundle with calculated cost
			orderItems = append(orderItems, models.OrderItem{
				ProductID:   0,
				ProductName: bundle.Name,
				Price:       bundle.Price,
				CostPrice:   bundleCost,
				Quantity:    reqBundle.Quantity,
				IsBundle:    true,
				BundleName:  bundle.Name,
			})
		}

		// Evaluate promos
		_, promoDiscount, err := s.promoSvc.EvaluatePromos(ctx, orderItems, subtotal)
		if err != nil {
			return err
		}

		// #9: Discount capped at 50% of subtotal
		maxDiscount := subtotal / 2
		if discount > maxDiscount {
			discount = maxDiscount
		}

		totalDiscount := discount + promoDiscount
		if totalDiscount > subtotal {
			totalDiscount = subtotal
		}
		afterDiscount := subtotal - totalDiscount

		// #4: Tax & service charge calculation from request settings
		taxRate := req.TaxRate
		if taxRate < 0 {
			taxRate = 0
		}
		tax := afterDiscount * taxRate / 100

		svcChargeRate := req.ServiceChargeRate
		if svcChargeRate < 0 {
			svcChargeRate = 0
		}
		svcCharge := afterDiscount * svcChargeRate / 100

		totalBeforeRound := afterDiscount + tax + svcCharge

		// Rounding
		roundingDiff := 0
		if req.Rounding && totalBeforeRound > 0 {
			remainder := totalBeforeRound % 100
			if remainder != 0 {
				roundingDiff = 100 - remainder
				// Round to nearest 100 instead of always up
				if remainder < 50 {
					roundingDiff = -remainder
				}
			}
		}
		total := totalBeforeRound + roundingDiff

		invoiceNumber := s.generateInvoiceNumber()

		paymentMethod := req.PaymentMethod
		var splitPayments []models.SplitPayment
		if len(req.SplitPayments) > 0 {
			paymentMethod = "SPLIT"
			splitSum := 0
			for _, sp := range req.SplitPayments {
				if sp.Amount <= 0 {
					return models.NewAPIError(models.ErrInvalidInput, fmt.Sprintf("Jumlah split %s harus > 0", sp.Method), 400)
				}
				// #2: Validate split method
				if !models.ValidPaymentMethods[sp.Method] {
					return models.NewAPIError(models.ErrInvalidInput, fmt.Sprintf("Metode %s tidak valid", sp.Method), 400)
				}
				splitPayments = append(splitPayments, models.SplitPayment{
					Method: sp.Method,
					Amount: sp.Amount,
				})
				splitSum += sp.Amount
			}
			// #2: Validate split sum >= total
			if splitSum < total {
				return models.NewAPIError(models.ErrInvalidInput, fmt.Sprintf("Total split (%d) kurang dari total bayar (%d)", splitSum, total), 400)
			}
		}

		order := &models.Order{
			InvoiceNumber:  invoiceNumber,
			Customer:       customer,
			Cashier:        cashierName,
			Subtotal:       subtotal,
			Tax:            tax,
			TaxRate:        taxRate,
			ServiceCharge:  svcCharge,
			RoundingDiff:   roundingDiff,
			Discount:       discount,
			PromoDiscount:  promoDiscount,
			Total:          total,
			PaymentMethod:  paymentMethod,
			SplitPayments:  splitPayments,
			PaymentStatus:  "COMPLETED",
			OrderStatus:    "COMPLETED",
			Notes:          req.Notes,
			OrderItems:     orderItems,
		}

		if err := tx.Create(order).Error; err != nil {
			return err
		}

		// #7: Update customer TotalSpent if customer is a known customer
		if req.CustomerID != nil {
			tx.Model(&models.Customer{}).Where("id = ?", *req.CustomerID).
				Update("total_spent", gorm.Expr("total_spent + ?", total))
		}

		finalOrder = order
		return nil
	})

	if err != nil {
		return nil, err
	}

	return finalOrder, nil
}

func (s *orderService) generateInvoiceNumber() string {
	now := time.Now()
	dateStr := now.Format("20060102")
	b := make([]byte, 4)
	rand.Read(b)
	randomHex := hex.EncodeToString(b)
	return fmt.Sprintf("INV-%s-%s%s", dateStr, now.Format("150405"), randomHex)
}

// #6: Stock rollback + #11: State machine
func (s *orderService) UpdateOrder(ctx context.Context, id uint, req *models.UpdateOrderRequest) (*models.Order, error) {
	order, err := s.orderRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if order == nil {
		return nil, models.NewAPIError(models.ErrNotFound, "Pesanan tidak ditemukan", 404)
	}

	if req.OrderStatus != nil {
		newStatus := *req.OrderStatus
		// #11: Validate status transition
		validNext, ok := models.ValidStatusTransitions[order.OrderStatus]
		if !ok {
			return nil, models.NewAPIError(models.ErrInvalidInput, fmt.Sprintf("Status %s tidak memiliki transisi yang valid", order.OrderStatus), 400)
		}
		isValid := false
		for _, s := range validNext {
			if s == newStatus {
				isValid = true
				break
			}
		}
		if !isValid {
			return nil, models.NewAPIError(models.ErrInvalidInput,
				fmt.Sprintf("Tidak bisa mengubah status dari %s ke %s", order.OrderStatus, newStatus), 400)
		}

		// #6: If changing away from COMPLETED → restore stock (partial refund)
		if order.OrderStatus == "COMPLETED" && newStatus != "COMPLETED" {
			if err := s.restoreStock(ctx, order); err != nil {
				return nil, err
			}
		}
		// If changing back to COMPLETED → re-deduct stock
		if order.OrderStatus != "COMPLETED" && newStatus == "COMPLETED" {
			if err := s.deductStock(ctx, order); err != nil {
				return nil, err
			}
		}

		order.OrderStatus = newStatus
	}

	if req.Notes != nil {
		order.Notes = *req.Notes
	}

	if err := s.orderRepo.Update(ctx, order); err != nil {
		return nil, err
	}

	return order, nil
}

// #16: Refund order — restore stock + mark as refunded
func (s *orderService) RefundOrder(ctx context.Context, id uint, req *models.RefundOrderRequest) (*models.Order, error) {
	order, err := s.orderRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if order == nil {
		return nil, models.NewAPIError(models.ErrNotFound, "Pesanan tidak ditemukan", 404)
	}
	if order.OrderStatus != "COMPLETED" {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Hanya pesanan COMPLETED yang bisa di-refund", 400)
	}

	if err := s.restoreStock(ctx, order); err != nil {
		return nil, err
	}

	order.OrderStatus = "REFUND"
	if req.Notes != "" {
		order.Notes = req.Notes
	}

	if err := s.orderRepo.Update(ctx, order); err != nil {
		return nil, err
	}

	return order, nil
}

func (s *orderService) restoreStock(ctx context.Context, order *models.Order) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, item := range order.OrderItems {
			if item.IsBundle || item.ProductID == 0 {
				continue
			}
			if err := tx.Model(&models.Product{}).Where("id = ?", item.ProductID).
				Update("stock", gorm.Expr("stock + ?", item.Quantity)).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *orderService) deductStock(ctx context.Context, order *models.Order) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, item := range order.OrderItems {
			if item.IsBundle || item.ProductID == 0 {
				continue
			}
			var product models.Product
			if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&product, item.ProductID).Error; err != nil {
				return err
			}
			if product.TrackStock && product.Stock < item.Quantity {
				return models.NewAPIError(models.ErrOutOfStock, fmt.Sprintf("Stok %s tidak cukup", product.Name), 400)
			}
			if product.TrackStock {
				product.Stock -= item.Quantity
				if err := tx.Save(&product).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}
