package main

import (
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
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Global DB instance
var DB *gorm.DB

// Response represents the JSON structure for health status
type Response struct {
	Status    string    `json:"status"`
	Database  string    `json:"database"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
}

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  Warning: .env file not found, using system environment variables")
	}

	// Connect to database
	connectDB()

	// Run migrations
	runMigrations()

	// Seed initial data if empty
	seedDatabase()

	// Setup Repositories
	productRepo := repositories.NewProductRepository(DB)
	orderRepo := repositories.NewOrderRepository(DB)

	// Setup Services
	productService := services.NewProductService(productRepo)
	orderService := services.NewOrderService(DB, orderRepo, productRepo)
	analyticsService := services.NewAnalyticsService(DB, orderRepo)

	// Setup Handlers
	productHandler := handlers.NewProductHandler(productService)
	orderHandler := handlers.NewOrderHandler(orderService)
	analyticsHandler := handlers.NewAnalyticsHandler(analyticsService)
	uploadHandler := handlers.NewUploadHandler()

	categoryRepo := repositories.NewCategoryRepository(DB)
	categoryService := services.NewCategoryService(categoryRepo, productRepo)
	categoryHandler := handlers.NewCategoryHandler(categoryService)

	targetRepo := repositories.NewTargetRepository(DB)
	targetService := services.NewTargetService(targetRepo)
	targetHandler := handlers.NewTargetHandler(targetService)

	// Create request router
	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("GET /api/health", healthHandler)

	// Image Upload & Serving
	mux.HandleFunc("POST /api/upload", uploadHandler.UploadImage)
	mux.Handle("GET /uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	// Target endpoints
	mux.HandleFunc("GET /api/targets", targetHandler.GetAll)
	mux.HandleFunc("GET /api/targets/{date}", targetHandler.GetByDate)
	mux.HandleFunc("POST /api/targets", targetHandler.Upsert)
	mux.HandleFunc("DELETE /api/targets/{date}", targetHandler.Delete)

	// Product endpoints
	mux.HandleFunc("GET /api/products", productHandler.GetAll)
	mux.HandleFunc("GET /api/products/{id}", productHandler.GetByID)
	mux.HandleFunc("POST /api/products", productHandler.Create)
	mux.HandleFunc("PUT /api/products/{id}", productHandler.Update)
	mux.HandleFunc("DELETE /api/products/{id}", productHandler.Delete)

	// Category endpoints
	mux.HandleFunc("GET /api/categories", categoryHandler.GetAll)
	mux.HandleFunc("POST /api/categories", categoryHandler.Create)
	mux.HandleFunc("PUT /api/categories/{id}", categoryHandler.Update)
	mux.HandleFunc("DELETE /api/categories/{id}", categoryHandler.Delete)

	// Order/Transaction endpoints
	mux.HandleFunc("POST /api/orders", orderHandler.Checkout)
	mux.HandleFunc("GET /api/orders", orderHandler.GetAll)
	mux.HandleFunc("GET /api/orders/{id}", orderHandler.GetByID)

	// Analytics endpoints
	mux.HandleFunc("GET /api/analytics", analyticsHandler.GetAnalytics)

	// Apply Middlewares (Logger -> CORS -> Recovery)
	handler := middleware.Recovery(middleware.CORS(middleware.Logger(mux)))

	port := getEnv("PORT", "8081")
	fmt.Printf("Backend server running on http://localhost:%s\n", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

// connectDB initializes GORM database connection
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
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	log.Println("✅ Database connected successfully")
}

// runMigrations automigrates database models
func runMigrations() {
	err := DB.AutoMigrate(
		&models.Category{},
		&models.Product{},
		&models.Order{},
		&models.OrderItem{},
		&models.DailyTarget{},
	)
	if err != nil {
		log.Fatalf("❌ Auto-migration failed: %v", err)
	}
	log.Println("✅ Database migration completed successfully")
}

// seedDatabase seeds initial data if table is empty
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
				log.Printf("⚠️  Failed to seed category %s: %v", c.Name, err)
			}
		}
		log.Println("🌱 Database seeded with default categories")
	}

	var count int64
	DB.Model(&models.Product{}).Count(&count)
	if count == 0 {
		defaultProducts := []models.Product{
			{Name: "Nasi Goreng Spesial", Category: "Makanan", Price: 25000, Icon: "restaurant", SKU: "FD-NASIGORENG", Stock: 100},
			{Name: "Ayam Bakar Madu", Category: "Makanan", Price: 30000, Icon: "set_meal", SKU: "FD-AYAMBAKAR", Stock: 100},
			{Name: "Mie Goreng Seafood", Category: "Makanan", Price: 28000, Icon: "ramen_dining", SKU: "FD-MIEGORENG", Stock: 100},
			{Name: "Sate Ayam Madura", Category: "Makanan", Price: 20000, Icon: "kebab_dining", SKU: "FD-SATEAYAM", Stock: 100},
			{Name: "Es Teh Manis", Category: "Minuman", Price: 5000, Icon: "local_cafe", SKU: "BV-ESTEH", Stock: 100},
			{Name: "Es Jeruk Peras", Category: "Minuman", Price: 8000, Icon: "local_drink", SKU: "BV-ESJERUK", Stock: 100},
			{Name: "Kopi Susu Gula Aren", Category: "Minuman", Price: 15000, Icon: "coffee", SKU: "BV-KOPISUSU", Stock: 100},
			{Name: "Jus Alpukat", Category: "Minuman", Price: 12000, Icon: "blender", SKU: "BV-JUSALPUKAT", Stock: 100},
			{Name: "Roti Bakar Coklat", Category: "Cemilan", Price: 15000, Icon: "bakery_dining", SKU: "SN-ROTIBAKAR", Stock: 100},
			{Name: "Pisang Goreng Keju", Category: "Cemilan", Price: 12000, Icon: "tapas", SKU: "SN-PISGORENG", Stock: 100},
		}

		for _, p := range defaultProducts {
			if err := DB.Create(&p).Error; err != nil {
				log.Printf("⚠️  Failed to seed product %s: %v", p.Name, err)
			}
		}
		log.Println("🌱 Database seeded with default products")
	}
}

// healthHandler returns a status check JSON response and pings the DB
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

// getEnv gets environment variable or returns fallback
func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
