package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"point-of-sale/backend/app/handlers"
	"point-of-sale/backend/app/middleware"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/repositories"
	"point-of-sale/backend/app/services"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

type Response struct {
	Status    string    `json:"status"`
	Database  string    `json:"database"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  Warning: .env file not found, using system environment variables")
	}

	connectDB()
	runMigrations()
	seedDatabase()

	// Repositories
	userRepo := repositories.NewUserRepository(DB)
	productRepo := repositories.NewProductRepository(DB)
	orderRepo := repositories.NewOrderRepository(DB)
	categoryRepo := repositories.NewCategoryRepository(DB)
	targetRepo := repositories.NewTargetRepository(DB)
	bundleRepo := repositories.NewBundleRepository(DB)
	promoRepo := repositories.NewPromoRepository(DB)
	supplierRepo := repositories.NewSupplierRepository(DB)
	customerRepo := repositories.NewCustomerRepository(DB)
	stockLogRepo := repositories.NewStockLogRepository(DB)
	expenseRepo := repositories.NewExpenseRepository(DB)
	branchRepo := repositories.NewBranchRepository(DB)
	productBranchRepo := repositories.NewProductBranchRepository(DB)

	// Services
	authService := services.NewAuthService(userRepo)
	promoSvc := services.NewPromoService(promoRepo)
	productService := services.NewProductService(productRepo, productBranchRepo)
	orderService := services.NewOrderService(DB, orderRepo, productRepo, bundleRepo, promoSvc, targetRepo)
	analyticsService := services.NewAnalyticsService(DB, orderRepo)
	categoryService := services.NewCategoryService(categoryRepo, productRepo)
	targetService := services.NewTargetService(targetRepo)
	bundleService := services.NewBundleService(bundleRepo)
	supplierSvc := services.NewSupplierService(supplierRepo)
	customerSvc := services.NewCustomerService(customerRepo, orderRepo)
	reportService := services.NewReportService(DB)
	expenseService := services.NewExpenseService(expenseRepo)
	branchService := services.NewBranchService(branchRepo, productBranchRepo)

	// Handlers
	authHandler := handlers.NewAuthHandler(authService)
	productHandler := handlers.NewProductHandler(productService)
	orderHandler := handlers.NewOrderHandler(orderService)
	analyticsHandler := handlers.NewAnalyticsHandler(analyticsService)
	uploadHandler := handlers.NewUploadHandler()
	categoryHandler := handlers.NewCategoryHandler(categoryService)
	targetHandler := handlers.NewTargetHandler(targetService)
	bundleHandler := handlers.NewBundleHandler(bundleService)
	promoHandler := handlers.NewPromoHandler(promoSvc)
	supplierHandler := handlers.NewSupplierHandler(supplierSvc)
	customerHandler := handlers.NewCustomerHandler(customerSvc)
	stockHandler := handlers.NewStockHandler(DB, productRepo, productBranchRepo, stockLogRepo)
	reportHandler := handlers.NewReportHandler(reportService)
	expenseHandler := handlers.NewExpenseHandler(expenseService)
	settingHandler := handlers.NewSettingHandler(DB)
	branchHandler := handlers.NewBranchHandler(branchService, productBranchRepo)

	// #17: Rate limiter (60 req/min for login, 300 req/min for others)
	loginLimiter := middleware.NewRateLimiter(10, 1*time.Minute) // 10 login attempts/min
	apiLimiter := middleware.NewRateLimiter(300, 1*time.Minute)

	mux := http.NewServeMux()

	// Public endpoints (no auth required) — with rate limiting on login
	mux.Handle("POST /api/auth/login", loginLimiter.Middleware(http.HandlerFunc(authHandler.Login)))
	mux.HandleFunc("GET /api/health", healthHandler)

	// Protected endpoints
	mux.HandleFunc("GET /api/auth/me", authHandler.Me)
	mux.HandleFunc("POST /api/auth/logout", authHandler.Logout)
	// Owner-only (wrapped with RequireOwner)
	mux.Handle("GET /api/users", middleware.RequireOwner(http.HandlerFunc(authHandler.GetAll)))
	mux.Handle("POST /api/users", middleware.RequireOwner(http.HandlerFunc(authHandler.Create)))
	mux.Handle("PUT /api/users/{id}", middleware.RequireOwner(http.HandlerFunc(authHandler.Update)))
	mux.Handle("DELETE /api/users/{id}", middleware.RequireOwner(http.HandlerFunc(authHandler.Delete)))

	mux.Handle("POST /api/products", middleware.RequireOwner(http.HandlerFunc(productHandler.Create)))
	mux.Handle("PUT /api/products/{id}", middleware.RequireOwner(http.HandlerFunc(productHandler.Update)))
	mux.Handle("DELETE /api/products/{id}", middleware.RequireOwner(http.HandlerFunc(productHandler.Delete)))

	mux.Handle("POST /api/categories", middleware.RequireOwner(http.HandlerFunc(categoryHandler.Create)))
	mux.Handle("PUT /api/categories/{id}", middleware.RequireOwner(http.HandlerFunc(categoryHandler.Update)))
	mux.Handle("DELETE /api/categories/{id}", middleware.RequireOwner(http.HandlerFunc(categoryHandler.Delete)))

	mux.Handle("DELETE /api/bundles/{id}", middleware.RequireOwner(http.HandlerFunc(bundleHandler.Delete)))

	mux.Handle("POST /api/promos", middleware.RequireOwner(http.HandlerFunc(promoHandler.Create)))
	mux.Handle("PUT /api/promos/{id}", middleware.RequireOwner(http.HandlerFunc(promoHandler.Update)))
	mux.Handle("DELETE /api/promos/{id}", middleware.RequireOwner(http.HandlerFunc(promoHandler.Delete)))

	mux.Handle("POST /api/suppliers", middleware.RequireOwner(http.HandlerFunc(supplierHandler.Create)))
	mux.Handle("PUT /api/suppliers/{id}", middleware.RequireOwner(http.HandlerFunc(supplierHandler.Update)))
	mux.Handle("DELETE /api/suppliers/{id}", middleware.RequireOwner(http.HandlerFunc(supplierHandler.Delete)))

	mux.Handle("DELETE /api/customers/{id}", middleware.RequireOwner(http.HandlerFunc(customerHandler.Delete)))

	// Cashier + Owner accessible
	mux.HandleFunc("POST /api/upload", uploadHandler.UploadImage)
	mux.Handle("GET /uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	mux.HandleFunc("GET /api/targets", targetHandler.GetAll)
	mux.HandleFunc("GET /api/targets/{date}", targetHandler.GetByDate)
	mux.HandleFunc("POST /api/targets", targetHandler.Upsert)
	mux.HandleFunc("DELETE /api/targets/{date}", targetHandler.Delete)

	mux.HandleFunc("GET /api/products", productHandler.GetAll)
	mux.HandleFunc("GET /api/products/{id}", productHandler.GetByID)

	mux.HandleFunc("GET /api/categories", categoryHandler.GetAll)

	mux.HandleFunc("POST /api/orders", orderHandler.Checkout)
	mux.HandleFunc("GET /api/orders", orderHandler.GetAll)
	mux.HandleFunc("GET /api/orders/{id}", orderHandler.GetByID)
	mux.HandleFunc("PUT /api/orders/{id}", orderHandler.Update)
	mux.HandleFunc("POST /api/orders/{id}/refund", orderHandler.Refund)

	mux.HandleFunc("GET /api/analytics", analyticsHandler.GetAnalytics)

	mux.HandleFunc("GET /api/bundles", bundleHandler.GetAll)
	mux.HandleFunc("GET /api/bundles/{id}", bundleHandler.GetByID)
	mux.HandleFunc("POST /api/bundles", bundleHandler.Create)
	mux.HandleFunc("PUT /api/bundles/{id}", bundleHandler.Update)

	mux.HandleFunc("GET /api/promos", promoHandler.GetAll)
	mux.HandleFunc("GET /api/promos/active", promoHandler.GetActive)
	mux.HandleFunc("GET /api/promos/{id}", promoHandler.GetByID)

	mux.HandleFunc("GET /api/suppliers", supplierHandler.GetAll)
	mux.HandleFunc("GET /api/suppliers/{id}", supplierHandler.GetByID)

	mux.HandleFunc("GET /api/customers", customerHandler.GetAll)
	mux.HandleFunc("GET /api/customers/{id}", customerHandler.GetByID)
	mux.HandleFunc("POST /api/customers", customerHandler.Create)
	mux.HandleFunc("PUT /api/customers/{id}", customerHandler.Update)
	mux.HandleFunc("GET /api/customers/{id}/orders", customerHandler.GetOrders)

	mux.Handle("POST /api/stock/adjust", middleware.RequireOwner(http.HandlerFunc(stockHandler.Adjust)))
	mux.HandleFunc("GET /api/stock/logs", stockHandler.GetLogs)
	mux.HandleFunc("GET /api/stock/logs/all", stockHandler.GetAllLogs)

	mux.HandleFunc("GET /api/settings/{key}", settingHandler.Get)
	mux.Handle("PUT /api/settings/{key}", middleware.RequireOwner(http.HandlerFunc(settingHandler.Upsert)))
	mux.Handle("POST /api/settings/midtrans", middleware.RequireOwner(http.HandlerFunc(settingHandler.SaveMidtransConfig)))
	mux.HandleFunc("GET /api/settings/midtrans", settingHandler.GetMidtransConfig)

	mux.Handle("GET /api/reports/stock", middleware.RequireOwner(http.HandlerFunc(reportHandler.GetStockReport)))
	mux.Handle("GET /api/reports/customers", middleware.RequireOwner(http.HandlerFunc(reportHandler.GetCustomerReport)))
	mux.Handle("GET /api/reports/profit-loss", middleware.RequireOwner(http.HandlerFunc(reportHandler.GetProfitLoss)))

	mux.HandleFunc("GET /api/expenses", expenseHandler.GetAll)
	mux.HandleFunc("GET /api/expenses/{id}", expenseHandler.GetByID)
	mux.HandleFunc("POST /api/expenses", expenseHandler.Create)
	mux.HandleFunc("PUT /api/expenses/{id}", expenseHandler.Update)
	mux.Handle("DELETE /api/expenses/{id}", middleware.RequireOwner(http.HandlerFunc(expenseHandler.Delete)))

	// Branch routes
	mux.HandleFunc("GET /api/branches", branchHandler.GetAll)
	mux.HandleFunc("GET /api/branches/{id}", branchHandler.GetByID)
	mux.Handle("POST /api/branches", middleware.RequireOwner(http.HandlerFunc(branchHandler.Create)))
	mux.Handle("PUT /api/branches/{id}", middleware.RequireOwner(http.HandlerFunc(branchHandler.Update)))
	mux.Handle("DELETE /api/branches/{id}", middleware.RequireOwner(http.HandlerFunc(branchHandler.Delete)))
	mux.Handle("POST /api/branches/{id}/products", middleware.RequireOwner(http.HandlerFunc(branchHandler.SetProductPrice)))
	mux.HandleFunc("GET /api/branches/{id}/products", branchHandler.GetProductPrices)
	mux.Handle("POST /api/branches/{id}/copy-products", middleware.RequireOwner(http.HandlerFunc(branchHandler.CopyProducts)))

	promoSvc.DeactivateExpiredPromos(context.Background(), nil)

	// Apply global rate limiter then CORS, Recovery, Auth
	authMw := middleware.Authenticate(DB, "/api/auth/login", "/api/health", "/uploads/")
	handler := middleware.CORS(middleware.Recovery(authMw(middleware.Logger(apiLimiter.Middleware(mux)))))

	port := getEnv("PORT", "8081")
	server := &http.Server{
		Addr:    ":" + port,
		Handler: handler,
	}

	// Graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan
		fmt.Println("\nShutting down server...")

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if sqlDB, err := DB.DB(); err == nil {
			sqlDB.Close()
		}
		if err := server.Shutdown(ctx); err != nil {
			log.Fatalf("Server forced to shutdown: %v", err)
		}
		fmt.Println("Server stopped gracefully")
	}()

	fmt.Printf("Backend server running on http://localhost:%s\n", port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server failed to start: %v", err)
	}
}

func connectDB() {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		getEnv("DB_HOST", "localhost"),
		getEnv("DB_USER", "postgres"),
		getEnv("DB_PASSWORD", ""),
		getEnv("DB_NAME", "postgres"),
		getEnv("DB_PORT", "5432"),
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Println("Database connected successfully")
}

func runMigrations() {
	appEnv := getEnv("APP_ENV", "development")
	if appEnv == "production" {
		log.Println("Skipping AutoMigrate in production - use manual migrations")
		return
	}

	err := DB.AutoMigrate(
		&models.Category{},
		&models.Product{},
		&models.Order{},
		&models.OrderItem{},
		&models.DailyTarget{},
		&models.User{},
		&models.StockLog{},
		&models.Bundle{},
		&models.BundleItem{},
		&models.Promo{},
		&models.Supplier{},
		&models.Customer{},
		&models.StoreSetting{},
		&models.Expense{},
		&models.Branch{},
		&models.ProductBranch{},
	)
	if err != nil {
		log.Fatalf("Auto-migration failed: %v", err)
	}
	log.Println("Database migration completed successfully")
}

func seedDatabase() {
	var branchOne uint = 1

	var countCat int64
	DB.Model(&models.Category{}).Count(&countCat)
	if countCat == 0 {
		defaultCategories := []models.Category{
			{BranchID: &branchOne, Name: "Makanan"},
			{BranchID: &branchOne, Name: "Minuman"},
			{BranchID: &branchOne, Name: "Cemilan"},
		}
		for _, c := range defaultCategories {
			if err := DB.Create(&c).Error; err != nil {
				log.Printf("Failed to seed category %s: %v", c.Name, err)
			}
		}
		log.Println("Database seeded with default categories")
	}

	var count int64
	DB.Model(&models.Product{}).Count(&count)
	if count == 0 {
		defaultProducts := []models.Product{
			{BranchID: &branchOne, Name: "Nasi Goreng Spesial", Category: "Makanan", Price: 25000, CostPrice: 15000, Icon: "restaurant", SKU: "FD-NASIGORENG", Stock: 100},
			{BranchID: &branchOne, Name: "Ayam Bakar Madu", Category: "Makanan", Price: 30000, CostPrice: 18000, Icon: "set_meal", SKU: "FD-AYAMBAKAR", Stock: 100},
			{BranchID: &branchOne, Name: "Mie Goreng Seafood", Category: "Makanan", Price: 28000, CostPrice: 16000, Icon: "ramen_dining", SKU: "FD-MIEGORENG", Stock: 100},
			{BranchID: &branchOne, Name: "Sate Ayam Madura", Category: "Makanan", Price: 20000, CostPrice: 12000, Icon: "kebab_dining", SKU: "FD-SATEAYAM", Stock: 100},
			{BranchID: &branchOne, Name: "Es Teh Manis", Category: "Minuman", Price: 5000, CostPrice: 2000, Icon: "local_cafe", SKU: "BV-ESTEH", Stock: 100},
			{BranchID: &branchOne, Name: "Es Jeruk Peras", Category: "Minuman", Price: 8000, CostPrice: 3000, Icon: "local_drink", SKU: "BV-ESJERUK", Stock: 100},
			{BranchID: &branchOne, Name: "Kopi Susu Gula Aren", Category: "Minuman", Price: 15000, CostPrice: 7000, Icon: "coffee", SKU: "BV-KOPISUSU", Stock: 100},
			{BranchID: &branchOne, Name: "Jus Alpukat", Category: "Minuman", Price: 12000, CostPrice: 5000, Icon: "blender", SKU: "BV-JUSALPUKAT", Stock: 100},
			{BranchID: &branchOne, Name: "Roti Bakar Coklat", Category: "Cemilan", Price: 15000, CostPrice: 8000, Icon: "bakery_dining", SKU: "SN-ROTIBAKAR", Stock: 100},
			{BranchID: &branchOne, Name: "Pisang Goreng Keju", Category: "Cemilan", Price: 12000, CostPrice: 6000, Icon: "tapas", SKU: "SN-PISGORENG", Stock: 100},
		}

		for _, p := range defaultProducts {
			if err := DB.Create(&p).Error; err != nil {
				log.Printf("Failed to seed product %s: %v", p.Name, err)
			}
		}
		log.Println("Database seeded with default products")
	}

	var userCount int64
	DB.Model(&models.User{}).Count(&userCount)
	if userCount == 0 {
		adminHash, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		if err != nil {
			log.Fatalf("Failed to hash admin password: %v", err)
		}
		kasirHash, err := bcrypt.GenerateFromPassword([]byte("kasir123"), bcrypt.DefaultCost)
		if err != nil {
			log.Fatalf("Failed to hash kasir password: %v", err)
		}

		defaultUsers := []models.User{
			{Username: "admin", Password: string(adminHash), Role: "owner", Name: "Admin Utama"},
			{Username: "kasir", Password: string(kasirHash), Role: "cashier", Name: "Kasir"},
		}
		for _, u := range defaultUsers {
			if err := DB.Create(&u).Error; err != nil {
				log.Printf("Failed to seed user %s: %v", u.Username, err)
			}
		}
		log.Println("Database seeded with default users")
	}

	var branchCount int64
	DB.Model(&models.Branch{}).Count(&branchCount)
	if branchCount == 0 {
		defaultBranches := []models.Branch{
			{Name: "Cabang Pusat", Code: "PST", Address: "Jl. Pekalipan No. 99", Phone: "081234567890", City: "Cirebon", Active: true},
			{Name: "Cabang Cirebon", Code: "CBR", Address: "Jl. Siliwangi No. 10", Phone: "081234567891", City: "Cirebon", Active: true},
		}
		for _, b := range defaultBranches {
			if err := DB.Create(&b).Error; err != nil {
				log.Printf("Failed to seed branch %s: %v", b.Name, err)
			}
		}
		log.Println("Database seeded with default branches")

		// Assign default cashier to first branch
		var firstBranch models.Branch
		DB.First(&firstBranch)
		if firstBranch.ID > 0 {
			DB.Model(&models.User{}).Where("username = ?", "kasir").Update("branch_id", firstBranch.ID)
			log.Printf("Assigned default kasir to branch %s", firstBranch.Name)
		}

		// Set branch-specific pricing for first branch
		var products []models.Product
		DB.Find(&products)
		if firstBranch.ID > 0 {
			for _, p := range products {
				branchPrice := p.Price + 5000
				branchStock := p.Stock + 50
				pb := models.ProductBranch{
					BranchID:   firstBranch.ID,
					ProductID:  p.ID,
					Price:      branchPrice,
					CostPrice:  p.CostPrice,
					Stock:      branchStock,
					TrackStock: p.TrackStock,
				}
				DB.Create(&pb)
			}
			log.Printf("Seeded %d product prices for branch %s", len(products), firstBranch.Name)
		}
	}

	// Auto-assign existing records without branch_id to first branch
	var branchCount2 int64
	DB.Model(&models.Branch{}).Count(&branchCount2)
	if branchCount2 > 0 {
		var firstBranch2 models.Branch
		DB.First(&firstBranch2)
		DB.Model(&models.Order{}).Where("branch_id IS NULL").Update("branch_id", firstBranch2.ID)
		DB.Model(&models.Expense{}).Where("branch_id IS NULL").Update("branch_id", firstBranch2.ID)
		DB.Model(&models.Bundle{}).Where("branch_id IS NULL").Update("branch_id", firstBranch2.ID)
		DB.Model(&models.Promo{}).Where("branch_id IS NULL").Update("branch_id", firstBranch2.ID)
		DB.Model(&models.Supplier{}).Where("branch_id IS NULL").Update("branch_id", firstBranch2.ID)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	dbStatus := "Healthy"

	sqlDB, err := DB.DB()
	if err != nil {
		dbStatus = "Unhealthy (Failed to get DB instance)"
	} else if err := sqlDB.Ping(); err != nil {
		dbStatus = "Unhealthy (Ping failed)"
	}

	res := Response{
		Status:    "OK",
		Database:  dbStatus,
		Message:   "Point of Sale API is healthy",
		Timestamp: time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(res); err != nil {
		log.Printf("Error encoding response: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
