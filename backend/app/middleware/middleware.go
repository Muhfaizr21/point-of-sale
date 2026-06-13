package middleware

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"point-of-sale/backend/app/models"
	"strings"
	"time"

	"gorm.io/gorm"
)

type contextKey string

const UserContextKey contextKey = "user"
const BranchContextKey contextKey = "branch_id"

var allowedOrigins = map[string]bool{
	"http://localhost:5173": true,
	"http://localhost:3000": true,
	"http://127.0.0.1:5173": true,
	"http://127.0.0.1:3000": true,
}

func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
			w.Header().Set("Access-Control-Allow-Origin", "*")
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		duration := time.Since(start)
		log.Printf("[HTTP] %s %s | Duration: %v", r.Method, r.RequestURI, duration)
	})
}

func Recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("[PANIC] Recovered from: %v", err)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(models.APIError{
					Code:    models.ErrInternalError,
					Message: "Terjadi kesalahan internal pada server",
				})
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func GetUser(r *http.Request) *models.User {
	if user, ok := r.Context().Value(UserContextKey).(*models.User); ok {
		return user
	}
	return nil
}

func GetBranchID(r *http.Request) *uint {
	if branchID, ok := r.Context().Value(BranchContextKey).(uint); ok {
		return &branchID
	}
	return nil
}

func RequireRole(roles ...string) func(http.Handler) http.Handler {
	allowed := make(map[string]bool)
	for _, r := range roles {
		allowed[r] = true
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user := GetUser(r)
			if user == nil {
				models.WriteError(w, models.NewAPIError(models.ErrUnauthorized, "Silakan login terlebih dahulu", 401))
				return
			}
			if !allowed[user.Role] {
				models.WriteError(w, models.NewAPIError(models.ErrForbidden, "Anda tidak memiliki izin untuk mengakses sumber daya ini", 403))
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func RequireOwner(next http.Handler) http.Handler {
	return RequireRole("owner")(next)
}

func Authenticate(db *gorm.DB, skipPaths ...string) func(http.Handler) http.Handler {
	skipMap := make(map[string]bool)
	for _, p := range skipPaths {
		skipMap[p] = true
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Skip auth for public paths
			for path := range skipMap {
				if strings.HasPrefix(r.URL.Path, path) {
					next.ServeHTTP(w, r)
					return
				}
			}

			// Skip OPTIONS requests for CORS
			if r.Method == "OPTIONS" {
				next.ServeHTTP(w, r)
				return
			}

			token := r.Header.Get("Authorization")
			if len(token) > 7 && strings.HasPrefix(token, "Bearer ") {
				token = token[7:]
			} else {
				token = ""
			}

			if token == "" {
				models.WriteError(w, models.NewAPIError(models.ErrUnauthorized, "Token diperlukan", 401))
				return
			}

			var user models.User
			if err := db.Preload("Branch").Where("token = ?", token).First(&user).Error; err != nil {
				models.WriteError(w, models.NewAPIError(models.ErrUnauthorized, "Token tidak valid", 401))
				return
			}

			if user.TokenExpiresAt != nil && time.Now().After(*user.TokenExpiresAt) {
				db.Model(&user).Update("token", "")
				models.WriteError(w, models.NewAPIError(models.ErrUnauthorized, "Token sudah kadaluarsa", 401))
				return
			}

			user.Password = ""
			user.Token = ""
			ctx := context.WithValue(r.Context(), UserContextKey, &user)
			if user.BranchID != nil {
				ctx = context.WithValue(ctx, BranchContextKey, *user.BranchID)
			}
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
