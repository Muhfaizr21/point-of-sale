package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"point-of-sale/backend/app/models"
	"strings"
	"time"
)

type UploadHandler struct{}

func NewUploadHandler() *UploadHandler {
	return &UploadHandler{}
}

func (h *UploadHandler) UploadImage(w http.ResponseWriter, r *http.Request) {
	// Parse the multipart form, 10MB max size
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Ukuran file terlalu besar (maksimal 10MB)", 400))
		return
	}

	// Retrieve file from form-data
	file, handler, err := r.FormFile("image")
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Gagal mengambil file gambar", 400))
		return
	}
	defer file.Close()

	// Check file extension
	ext := strings.ToLower(filepath.Ext(handler.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" && ext != ".webp" {
		models.WriteError(w, models.NewAPIError(models.ErrInvalidInput, "Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WEBP", 400))
		return
	}

	// Create uploads directory if it doesn't exist
	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInternalError, "Gagal membuat folder penyimpanan", 500))
		return
	}

	// #13: Generate unique file name with nanosecond + random suffix
	fileName := strings.ReplaceAll(handler.Filename, " ", "-")
	b := make([]byte, 4)
	rand.Read(b)
	randomHex := hex.EncodeToString(b)
	uniqueName := fmt.Sprintf("%s-%s-%s", time.Now().Format("20060102150405.000000000"), randomHex, fileName)
	filePath := filepath.Join(uploadDir, uniqueName)

	// Create target file on server
	dst, err := os.Create(filePath)
	if err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInternalError, "Gagal membuat file di server", 500))
		return
	}
	defer dst.Close()

	// Copy uploaded file to target
	if _, err = io.Copy(dst, file); err != nil {
		models.WriteError(w, models.NewAPIError(models.ErrInternalError, "Gagal menyimpan file di server", 500))
		return
	}

	// Return relative file path (served as static file)
	response := map[string]string{
		"url": "/uploads/" + uniqueName,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
