package services

import (
	"context"
	"fmt"
	"math/rand"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/repositories"
	"time"

	"gorm.io/gorm"
)

type OrderService interface {
	Checkout(ctx context.Context, req *models.CreateOrderRequest) (*models.Order, error)
	GetAllOrders(ctx context.Context) ([]models.Order, error)
	GetFilteredOrders(ctx context.Context, query *models.OrderQuery) (*models.OrderListResponse, error)
	GetOrderByID(ctx context.Context, id uint) (*models.Order, error)
}

type orderService struct {
	db          *gorm.DB
	orderRepo   repositories.OrderRepository
	productRepo repositories.ProductRepository
}

func NewOrderService(db *gorm.DB, orderRepo repositories.OrderRepository, productRepo repositories.ProductRepository) OrderService {
	return &orderService{
		db:          db,
		orderRepo:   orderRepo,
		productRepo: productRepo,
	}
}

func (s *orderService) GetAllOrders(ctx context.Context) ([]models.Order, error) {
	return s.orderRepo.GetAll(ctx)
}

func (s *orderService) GetOrderByID(ctx context.Context, id uint) (*models.Order, error) {
	return s.orderRepo.GetByID(ctx, id)
}

func (s *orderService) GetFilteredOrders(ctx context.Context, query *models.OrderQuery) (*models.OrderListResponse, error) {
	// Set defaults
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

func (s *orderService) Checkout(ctx context.Context, req *models.CreateOrderRequest) (*models.Order, error) {
	if len(req.Items) == 0 {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Keranjang belanja tidak boleh kosong", 400)
	}

	// Set defaults
	customer := req.Customer
	if customer == "" {
		customer = "Umum"
	}
	discount := req.Discount
	if discount < 0 {
		discount = 0
	}

	var finalOrder *models.Order

	// Run GORM Transaction to ensure atomicity
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var subtotal int
		var orderItems []models.OrderItem

		// Resolve items, check and reduce stock
		for _, reqItem := range req.Items {
			var product models.Product
			// Lock product row for update to prevent race conditions in concurrent orders
			if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&product, reqItem.ProductID).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					return models.NewAPIError(models.ErrNotFound, fmt.Sprintf("Produk dengan ID %d tidak ditemukan", reqItem.ProductID), 404)
				}
				return err
			}

			// Validate stock
			if product.Stock < reqItem.Quantity {
				return models.NewAPIError(models.ErrOutOfStock, fmt.Sprintf("Stok produk %s tidak mencukupi (Tersedia: %d, Diminta: %d)", product.Name, product.Stock, reqItem.Quantity), 400)
			}

			// Deduct stock
			product.Stock -= reqItem.Quantity
			if err := tx.Save(&product).Error; err != nil {
				return err
			}

			// Calculate subtotal and build order item
			itemPrice := product.Price
			if reqItem.VariationName != "" {
				for _, v := range product.Variations {
					if v.Name == reqItem.VariationName {
						itemPrice = v.Price
						break
					}
				}
			}
			itemTotal := itemPrice * reqItem.Quantity
			subtotal += itemTotal

			orderItems = append(orderItems, models.OrderItem{
				ProductID:     product.ID,
				ProductName:   product.Name,
				VariationName: reqItem.VariationName,
				Price:         itemPrice,
				Quantity:      reqItem.Quantity,
			})
		}

		// Calculate total
		total := subtotal - discount

		// Generate invoice number
		invoiceNumber := s.generateInvoiceNumber()

		// Save order
		order := &models.Order{
			InvoiceNumber: invoiceNumber,
			Customer:     customer,
			Cashier:      "Admin",
			Subtotal:     subtotal,
			Tax:          0,
			Discount:     discount,
			Total:        total,
			PaymentMethod: req.PaymentMethod,
			PaymentStatus: "COMPLETED",
			OrderStatus:   "COMPLETED",
			OrderItems:    orderItems,
		}

		if err := tx.Create(order).Error; err != nil {
			return err
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
	rand.Seed(time.Now().UnixNano())
	randomDigits := fmt.Sprintf("%04d", rand.Intn(10000))
	return fmt.Sprintf("INV-%s-%s", dateStr, randomDigits)
}
