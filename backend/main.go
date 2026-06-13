package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
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

	// Services
	authService := services.NewAuthService(userRepo)
	promoSvc := services.NewPromoService(promoRepo)
	productService := services.NewProductService(productRepo)
	orderService := services.NewOrderService(DB, orderRepo, productRepo, bundleRepo, promoSvc, targetRepo)
	analyticsService := services.NewAnalyticsService(DB, orderRepo)
	categoryService := services.NewCategoryService(categoryRepo, productRepo)
	targetService := services.NewTargetService(targetRepo)
	bundleService := services.NewBundleService(bundleRepo)
	supplierSvc := services.NewSupplierService(supplierRepo)
	customerSvc := services.NewCustomerService(customerRepo, orderRepo)
	reportService := services.NewReportService(DB)

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
	stockHandler := handlers.NewStockHandler(DB, productRepo, stockLogRepo)
	reportHandler := handlers.NewReportHandler(reportService)
	settingHandler := handlers.NewSettingHandler(DB)

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
	mux.HandleFunc("GET /api/users", authHandler.GetAll)
	mux.HandleFunc("POST /api/users", authHandler.Create)
	mux.HandleFunc("PUT /api/users/{id}", authHandler.Update)
	mux.HandleFunc("DELETE /api/users/{id}", authHandler.Delete)

	mux.HandleFunc("POST /api/upload", uploadHandler.UploadImage)
	mux.Handle("GET /uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	mux.HandleFunc("GET /api/targets", targetHandler.GetAll)
	mux.HandleFunc("GET /api/targets/{date}", targetHandler.GetByDate)
	mux.HandleFunc("POST /api/targets", targetHandler.Upsert)
	mux.HandleFunc("DELETE /api/targets/{date}", targetHandler.Delete)

	mux.HandleFunc("GET /api/products", productHandler.GetAll)
	mux.HandleFunc("GET /api/products/{id}", productHandler.GetByID)
	mux.HandleFunc("POST /api/products", productHandler.Create)
	mux.HandleFunc("PUT /api/products/{id}", productHandler.Update)
	mux.HandleFunc("DELETE /api/products/{id}", productHandler.Delete)

	mux.HandleFunc("GET /api/categories", categoryHandler.GetAll)
	mux.HandleFunc("POST /api/categories", categoryHandler.Create)
	mux.HandleFunc("PUT /api/categories/{id}", categoryHandler.Update)
	mux.HandleFunc("DELETE /api/categories/{id}", categoryHandler.Delete)

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
	mux.HandleFunc("DELETE /api/bundles/{id}", bundleHandler.Delete)

	mux.HandleFunc("GET /api/promos", promoHandler.GetAll)
	mux.HandleFunc("GET /api/promos/{id}", promoHandler.GetByID)
	mux.HandleFunc("POST /api/promos", promoHandler.Create)
	mux.HandleFunc("PUT /api/promos/{id}", promoHandler.Update)
	mux.HandleFunc("DELETE /api/promos/{id}", promoHandler.Delete)

	mux.HandleFunc("GET /api/suppliers", supplierHandler.GetAll)
	mux.HandleFunc("GET /api/suppliers/{id}", supplierHandler.GetByID)
	mux.HandleFunc("POST /api/suppliers", supplierHandler.Create)
	mux.HandleFunc("PUT /api/suppliers/{id}", supplierHandler.Update)
	mux.HandleFunc("DELETE /api/suppliers/{id}", supplierHandler.Delete)

	mux.HandleFunc("GET /api/customers", customerHandler.GetAll)
	mux.HandleFunc("GET /api/customers/{id}", customerHandler.GetByID)
	mux.HandleFunc("POST /api/customers", customerHandler.Create)
	mux.HandleFunc("PUT /api/customers/{id}", customerHandler.Update)
	mux.HandleFunc("DELETE /api/customers/{id}", customerHandler.Delete)
	mux.HandleFunc("GET /api/customers/{id}/orders", customerHandler.GetOrders)

	mux.HandleFunc("POST /api/stock/adjust", stockHandler.Adjust)
	mux.HandleFunc("GET /api/stock/logs", stockHandler.GetLogs)
	mux.HandleFunc("GET /api/stock/logs/all", stockHandler.GetAllLogs)

	mux.HandleFunc("GET /api/settings/{key}", settingHandler.Get)
	mux.HandleFunc("PUT /api/settings/{key}", settingHandler.Upsert)

	mux.HandleFunc("GET /api/reports/stock", reportHandler.GetStockReport)
	mux.HandleFunc("GET /api/reports/customers", reportHandler.GetCustomerReport)
	mux.HandleFunc("GET /api/reports/profit-loss", reportHandler.GetProfitLoss)

	promoSvc.DeactivateExpiredPromos(context.Background())

	// Apply global rate limiter then CORS, Recovery, Auth
	authMw := middleware.Authenticate(DB, "/api/auth/login", "/api/health", "/uploads/")
	handler := middleware.CORS(middleware.Recovery(authMw(middleware.Logger(apiLimiter.Middleware(mux)))))

	port := getEnv("PORT", "8081")
	fmt.Printf("Backend server running on http://localhost:%s\n", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
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
	)
	if err != nil {
		log.Fatalf("Auto-migration failed: %v", err)
	}
	log.Println("Database migration completed successfully")
}

func seedDatabase() {
	var countCat int64
	DB.Model(&models.Category{}).Count(&countCat)
	if countCat == 0 {
		defaultCategories := []models.Category{
			{Name: "Makanan"},
			{Name: "Minuman"},
			{Name: "Cemilan"},
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
			{Name: "Nasi Goreng Spesial", Category: "Makanan", Price: 25000, CostPrice: 15000, Icon: "restaurant", SKU: "FD-NASIGORENG", Stock: 100},
			{Name: "Ayam Bakar Madu", Category: "Makanan", Price: 30000, CostPrice: 18000, Icon: "set_meal", SKU: "FD-AYAMBAKAR", Stock: 100},
			{Name: "Mie Goreng Seafood", Category: "Makanan", Price: 28000, CostPrice: 16000, Icon: "ramen_dining", SKU: "FD-MIEGORENG", Stock: 100},
			{Name: "Sate Ayam Madura", Category: "Makanan", Price: 20000, CostPrice: 12000, Icon: "kebab_dining", SKU: "FD-SATEAYAM", Stock: 100},
			{Name: "Es Teh Manis", Category: "Minuman", Price: 5000, CostPrice: 2000, Icon: "local_cafe", SKU: "BV-ESTEH", Stock: 100},
			{Name: "Es Jeruk Peras", Category: "Minuman", Price: 8000, CostPrice: 3000, Icon: "local_drink", SKU: "BV-ESJERUK", Stock: 100},
			{Name: "Kopi Susu Gula Aren", Category: "Minuman", Price: 15000, CostPrice: 7000, Icon: "coffee", SKU: "BV-KOPISUSU", Stock: 100},
			{Name: "Jus Alpukat", Category: "Minuman", Price: 12000, CostPrice: 5000, Icon: "blender", SKU: "BV-JUSALPUKAT", Stock: 100},
			{Name: "Roti Bakar Coklat", Category: "Cemilan", Price: 15000, CostPrice: 8000, Icon: "bakery_dining", SKU: "SN-ROTIBAKAR", Stock: 100},
			{Name: "Pisang Goreng Keju", Category: "Cemilan", Price: 12000, CostPrice: 6000, Icon: "tapas", SKU: "SN-PISGORENG", Stock: 100},
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
