package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Global DB instance
var DB *gorm.DB

// Response represents the JSON structure for endpoint responses
type Response struct {
	Status      string    `json:"status"`
	Database    string    `json:"database"`
	Message     string    `json:"message"`
	Timestamp   time.Time `json:"timestamp"`
}

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  Warning: .env file not found, using system environment variables")
	}

	// Connect to database
	connectDB()

	// Create request router
	mux := http.NewServeMux()

	// Register routes
	mux.HandleFunc("GET /api/health", healthHandler)

	// Wrap mux with CORS middleware
	handler := enableCORS(mux)

	port := getEnv("PORT", "8080")
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

// healthHandler returns a status check JSON response and pings the DB
func healthHandler(w http.ResponseWriter, r *http.Request) {
	dbStatus := "Healthy"
	
	// Ping DB
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

// enableCORS middleware adds basic CORS headers to incoming requests
func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// getEnv gets environment variable or returns fallback
func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
