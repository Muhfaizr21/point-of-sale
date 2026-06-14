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
	subscriptionRepo := repositories.NewSubscriptionRepository(DB)
	broadcastRepo := repositories.NewBroadcastRepository(DB)
	integrationRepo := repositories.NewIntegrationRepository(DB)
	superadminRepo := repositories.NewSuperadminRepository(DB)

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
	merchantRepo := repositories.NewMerchantRepository(DB)
	merchantService := services.NewMerchantService(merchantRepo)
	subscriptionService := services.NewSubscriptionService(subscriptionRepo)
	broadcastService := services.NewBroadcastService(broadcastRepo)
	integrationService := services.NewIntegrationService(integrationRepo)
	superadminService := services.NewSuperadminService(superadminRepo)

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
	merchantHandler := handlers.NewMerchantHandler(merchantService)
	subscriptionHandler := handlers.NewSubscriptionHandler(subscriptionService)
	broadcastHandler := handlers.NewBroadcastHandler(broadcastService)
	integrationHandler := handlers.NewIntegrationHandler(integrationService)
	superadminHandler := handlers.NewSuperadminHandler(superadminService)

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

	mux.Handle("GET /api/merchants", middleware.RequireSuperadmin(http.HandlerFunc(merchantHandler.GetAll)))
	mux.Handle("GET /api/merchants/{id}", middleware.RequireSuperadmin(http.HandlerFunc(merchantHandler.GetByID)))
	mux.Handle("POST /api/merchants", middleware.RequireSuperadmin(http.HandlerFunc(merchantHandler.Create)))
	mux.Handle("PUT /api/merchants/{id}", middleware.RequireSuperadmin(http.HandlerFunc(merchantHandler.Update)))

	// Subscription routes (superadmin only)
	mux.Handle("GET /api/subscriptions/plans", middleware.RequireSuperadmin(http.HandlerFunc(subscriptionHandler.GetPlans)))
	mux.Handle("POST /api/subscriptions/plans", middleware.RequireSuperadmin(http.HandlerFunc(subscriptionHandler.CreatePlan)))
	mux.Handle("PUT /api/subscriptions/plans/{id}", middleware.RequireSuperadmin(http.HandlerFunc(subscriptionHandler.UpdatePlan)))
	mux.Handle("GET /api/subscriptions", middleware.RequireSuperadmin(http.HandlerFunc(subscriptionHandler.GetSubscriptions)))
	mux.Handle("POST /api/subscriptions/assign", middleware.RequireSuperadmin(http.HandlerFunc(subscriptionHandler.Assign)))
	mux.HandleFunc("GET /api/subscriptions/my", subscriptionHandler.GetMySubscription)

	// Broadcast routes
	mux.Handle("GET /api/broadcasts", middleware.RequireSuperadmin(http.HandlerFunc(broadcastHandler.GetAll)))
	mux.Handle("POST /api/broadcasts", middleware.RequireSuperadmin(http.HandlerFunc(broadcastHandler.Create)))
	mux.Handle("DELETE /api/broadcasts/{id}", middleware.RequireSuperadmin(http.HandlerFunc(broadcastHandler.Delete)))
	mux.HandleFunc("GET /api/broadcasts/unread", broadcastHandler.GetUnread)
	mux.HandleFunc("POST /api/broadcasts/{id}/read", broadcastHandler.MarkRead)

	// Integration routes
	mux.Handle("GET /api/integrations", middleware.RequireSuperadmin(http.HandlerFunc(integrationHandler.GetAll)))
	mux.Handle("PUT /api/integrations/{merchant_id}/{app}", middleware.RequireSuperadmin(http.HandlerFunc(integrationHandler.Upsert)))
	mux.HandleFunc("GET /api/integrations/my", integrationHandler.GetMy)
	mux.Handle("PUT /api/integrations/my/{app}", middleware.RequireOwner(http.HandlerFunc(integrationHandler.UpdateMy)))

	// Superadmin routes
	mux.Handle("GET /api/superadmin/revenue", middleware.RequireSuperadmin(http.HandlerFunc(superadminHandler.GetRevenueDashboard)))
	mux.Handle("GET /api/superadmin/orders", middleware.RequireSuperadmin(http.HandlerFunc(superadminHandler.GetAllOrders)))
	mux.Handle("GET /api/superadmin/orders/stats", middleware.RequireSuperadmin(http.HandlerFunc(superadminHandler.GetOrderStats)))
	mux.Handle("GET /api/superadmin/revenue/merchants", middleware.RequireSuperadmin(http.HandlerFunc(superadminHandler.GetRevenuePerMerchant)))
	mux.Handle("GET /api/superadmin/subscriptions/payments", middleware.RequireSuperadmin(http.HandlerFunc(superadminHandler.GetPaymentTransactions)))
	mux.Handle("GET /api/superadmin/subscriptions/payments/stats", middleware.RequireSuperadmin(http.HandlerFunc(superadminHandler.GetPaymentStats)))
	mux.Handle("GET /api/superadmin/health", middleware.RequireSuperadmin(http.HandlerFunc(superadminHandler.GetSystemHealth)))
	mux.Handle("GET /api/superadmin/demographics", middleware.RequireSuperadmin(http.HandlerFunc(superadminHandler.GetDemographics)))
	mux.Handle("GET /api/superadmin/export", middleware.RequireSuperadmin(http.HandlerFunc(superadminHandler.GetExportData)))

	// Audit + Settings + Maintenance + Contact routes
	mux.Handle("GET /api/superadmin/audit-logs", middleware.RequireSuperadmin(http.HandlerFunc(superadminHandler.GetAuditLogs)))
	mux.Handle("GET /api/superadmin/platform-settings", middleware.RequireSuperadmin(http.HandlerFunc(superadminHandler.GetPlatformSettings)))
	mux.Handle("POST /api/superadmin/platform-settings", middleware.RequireSuperadmin(http.HandlerFunc(superadminHandler.UpdatePlatformSetting)))
	mux.Handle("GET /api/superadmin/maintenance", middleware.RequireSuperadmin(http.HandlerFunc(superadminHandler.GetMaintenanceStatus)))
	mux.Handle("POST /api/superadmin/maintenance", middleware.RequireSuperadmin(http.HandlerFunc(superadminHandler.SetMaintenanceMode)))
	mux.Handle("GET /api/superadmin/contacts", middleware.RequireSuperadmin(http.HandlerFunc(superadminHandler.GetContactMessages)))
	mux.Handle("PUT /api/superadmin/contacts/{id}/read", middleware.RequireSuperadmin(http.HandlerFunc(superadminHandler.MarkContactRead)))
	mux.Handle("DELETE /api/superadmin/contacts/{id}", middleware.RequireSuperadmin(http.HandlerFunc(superadminHandler.DeleteContactMessage)))
	mux.HandleFunc("POST /api/contact", superadminHandler.CreateContactMessage)

	// Ticket routes (superadmin)
	mux.Handle("GET /api/superadmin/tickets", middleware.RequireSuperadmin(http.HandlerFunc(superadminHandler.GetTickets)))
	mux.Handle("GET /api/superadmin/tickets/{id}", middleware.RequireSuperadmin(http.HandlerFunc(superadminHandler.GetTicketDetail)))
	mux.Handle("POST /api/superadmin/tickets/{id}/reply", middleware.RequireSuperadmin(http.HandlerFunc(superadminHandler.ReplyTicket)))
	mux.Handle("PUT /api/superadmin/tickets/{id}/close", middleware.RequireSuperadmin(http.HandlerFunc(superadminHandler.CloseTicket)))
	// Ticket routes (merchant)
	mux.HandleFunc("GET /api/tickets/my", superadminHandler.GetMyTickets)
	mux.HandleFunc("POST /api/tickets", superadminHandler.CreateTicket)
	mux.HandleFunc("GET /api/tickets/{id}", superadminHandler.GetMyTicketDetail)
	mux.HandleFunc("POST /api/tickets/{id}/reply", superadminHandler.ReplyMyTicket)
	mux.HandleFunc("PUT /api/tickets/{id}/close", superadminHandler.CloseMyTicket)

	promoSvc.DeactivateExpiredPromos(context.Background(), nil, nil)

	// Apply global rate limiter then CORS, Recovery, Auth, Maintenance
	authMw := middleware.Authenticate(DB, "/api/auth/login", "/api/health", "/uploads/")
	maintenanceMw := middleware.MaintenanceMode(DB, "/api/auth/login", "/api/contact", "/api/health")
	handler := middleware.CORS(middleware.Recovery(authMw(maintenanceMw(middleware.Logger(apiLimiter.Middleware(mux))))))

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
		&models.Merchant{},
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
		&models.SubscriptionPlan{},
		&models.MerchantSubscription{},
		&models.Broadcast{},
		&models.BroadcastRead{},
		&models.MerchantIntegration{},
		&models.PaymentTransaction{},
		&models.AuditLog{},
		&models.ContactMessage{},
		&models.Ticket{},
		&models.TicketMessage{},
	)
	if err != nil {
		log.Fatalf("Auto-migration failed: %v", err)
	}
	log.Println("Database migration completed successfully")
}

func seedDatabase() {
	var branchOne uint = 1

	var merchantCount int64
	DB.Model(&models.Merchant{}).Count(&merchantCount)
	if merchantCount == 0 {
		DB.Create(&models.Merchant{Name: "PEKALIPAN", Code: "PKP", Email: "admin@pekalipan.com", Active: true})
		log.Println("Default merchant seeded")
	}

	// Update existing data without merchant_id to merchant 1
	var firstMerchant models.Merchant
	DB.First(&firstMerchant)
	mid := firstMerchant.ID
	DB.Model(&models.Branch{}).Where("merchant_id IS NULL").Update("merchant_id", mid)
	DB.Model(&models.User{}).Where("merchant_id IS NULL AND role != ?", "superadmin").Update("merchant_id", mid)
	DB.Model(&models.Product{}).Where("merchant_id IS NULL").Update("merchant_id", mid)
	DB.Model(&models.Category{}).Where("merchant_id IS NULL").Update("merchant_id", mid)
	DB.Model(&models.Order{}).Where("merchant_id IS NULL").Update("merchant_id", mid)

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
			{Username: "admin", Password: string(adminHash), Role: "owner", Name: "Admin Utama", MerchantID: &firstMerchant.ID},
			{Username: "kasir", Password: string(kasirHash), Role: "cashier", Name: "Kasir", MerchantID: &firstMerchant.ID},
		}
		for _, u := range defaultUsers {
			if err := DB.Create(&u).Error; err != nil {
				log.Printf("Failed to seed user %s: %v", u.Username, err)
			}
		}
		log.Println("Database seeded with default users")
	}

	var superCount int64
	// Ensure superadmin has NO merchant_id (platform-level user)
	DB.Exec("UPDATE users SET merchant_id = NULL WHERE role = ?", "superadmin")

	DB.Model(&models.User{}).Where("role = ?", "superadmin").Count(&superCount)
	if superCount == 0 {
		superHash, err := bcrypt.GenerateFromPassword([]byte("superadmin123"), bcrypt.DefaultCost)
		if err == nil {
			DB.Create(&models.User{
				Username: "superadmin@sentrakas.com",
				Password: string(superHash),
				Role:     "superadmin",
				Name:     "Super Admin",
			})
			log.Println("Superadmin user created")
		}
	}

	// Auto-assign merchant_id to any users/records that still have NULL merchant_id
	var anyMerchant models.Merchant
	if err := DB.First(&anyMerchant).Error; err == nil {
		mid2 := anyMerchant.ID
		DB.Model(&models.User{}).Where("merchant_id IS NULL AND role != ?", "superadmin").Update("merchant_id", mid2)
		DB.Model(&models.Branch{}).Where("merchant_id IS NULL").Update("merchant_id", mid2)
		DB.Model(&models.Product{}).Where("merchant_id IS NULL").Update("merchant_id", mid2)
		DB.Model(&models.Category{}).Where("merchant_id IS NULL").Update("merchant_id", mid2)
		DB.Model(&models.Order{}).Where("merchant_id IS NULL").Update("merchant_id", mid2)
		DB.Model(&models.Expense{}).Where("merchant_id IS NULL").Update("merchant_id", mid2)
		DB.Model(&models.Bundle{}).Where("merchant_id IS NULL").Update("merchant_id", mid2)
		DB.Model(&models.Promo{}).Where("merchant_id IS NULL").Update("merchant_id", mid2)
		DB.Model(&models.Supplier{}).Where("merchant_id IS NULL").Update("merchant_id", mid2)
		DB.Model(&models.DailyTarget{}).Where("merchant_id IS NULL").Update("merchant_id", mid2)
		DB.Model(&models.Customer{}).Where("merchant_id IS NULL").Update("merchant_id", mid2)
	}

	// Seed subscription plans
	var planCount int64
	DB.Model(&models.SubscriptionPlan{}).Count(&planCount)
	if planCount == 0 {
		plans := []models.SubscriptionPlan{
			{Name: "Basic", Code: "BASIC", PriceMonthly: 0, PriceYearly: 0, MaxBranches: 1, MaxUsers: 2, Features: []string{"1 toko", "2 pengguna", "Laporan dasar", "Dukungan email"}, Active: true},
			{Name: "Pro", Code: "PRO", PriceMonthly: 150000, PriceYearly: 1500000, MaxBranches: 5, MaxUsers: 10, Features: []string{"5 toko", "10 pengguna", "Laporan lengkap", "Multi-cabang", "Dukungan prioritas"}, Active: true},
			{Name: "Enterprise", Code: "ENT", PriceMonthly: 500000, PriceYearly: 5000000, MaxBranches: 100, MaxUsers: 999, Features: []string{"100+ toko", "Unlimited pengguna", "Laporan custom", "API access", "Dedicated support", "White-label"}, Active: true},
		}
		for _, p := range plans { DB.Create(&p) }
		log.Println("Subscription plans seeded")
	}

	var branchCount int64
	DB.Model(&models.Branch{}).Count(&branchCount)
	if branchCount == 0 {
		var firstMerchant models.Merchant
		DB.First(&firstMerchant)
		mid := firstMerchant.ID

		defaultBranches := []models.Branch{
			{Name: "Cabang Pusat", Code: "PST", Address: "Jl. Pekalipan No. 99", Phone: "081234567890", City: "Cirebon", Active: true, MerchantID: &mid},
			{Name: "Cabang Cirebon", Code: "CBR", Address: "Jl. Siliwangi No. 10", Phone: "081234567891", City: "Cirebon", Active: true, MerchantID: &mid},
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
					MerchantID: &mid,
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
		DB.Model(&models.Product{}).Where("branch_id IS NULL").Update("branch_id", firstBranch2.ID)
		DB.Model(&models.Category{}).Where("branch_id IS NULL").Update("branch_id", firstBranch2.ID)
		DB.Model(&models.DailyTarget{}).Where("branch_id IS NULL").Update("branch_id", firstBranch2.ID)
		// Drop old global unique indexes (GORM auto-named)
		for _, name := range []string{"idx_categories_name", "uix_categories_name", "uni_categories_name"} {
			DB.Migrator().DropIndex(&models.Category{}, name)
		}
		for _, name := range []string{"idx_daily_targets_date", "uix_daily_targets_date", "uni_daily_targets_date"} {
			DB.Migrator().DropIndex(&models.DailyTarget{}, name)
		}
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
