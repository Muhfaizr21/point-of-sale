package models

import (
	"encoding/json"
	"net/http"
)

type ErrorCode string

const (
	ErrNotFound         ErrorCode = "NOT_FOUND"
	ErrInvalidInput     ErrorCode = "INVALID_INPUT"
	ErrInternalError    ErrorCode = "INTERNAL_ERROR"
	ErrDuplicateSKU     ErrorCode = "DUPLICATE_SKU"
	ErrOutOfStock       ErrorCode = "OUT_OF_STOCK"
	ErrUnauthorized     ErrorCode = "UNAUTHORIZED"
	ErrConflict         ErrorCode = "CONFLICT"
	ErrForbidden        ErrorCode = "FORBIDDEN"
)

type APIError struct {
	Code    ErrorCode `json:"code"`
	Message string    `json:"message"`
	Status  int       `json:"-"`
}

func (e *APIError) Error() string {
	return e.Message
}

func NewAPIError(code ErrorCode, message string, status int) *APIError {
	return &APIError{
		Code:    code,
		Message: message,
		Status:  status,
	}
}

// WriteError sends a formatted JSON error response
func WriteError(w http.ResponseWriter, err error) {
	w.Header().Set("Content-Type", "application/json")
	if apiErr, ok := err.(*APIError); ok {
		w.WriteHeader(apiErr.Status)
		json.NewEncoder(w).Encode(apiErr)
		return
	}

	w.WriteHeader(http.StatusInternalServerError)
	json.NewEncoder(w).Encode(APIError{
		Code:    ErrInternalError,
		Message: err.Error(),
	})
}
