package services

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/repositories"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type AuthService interface {
	Login(ctx context.Context, username, password string) (*models.LoginResponse, error)
	Me(ctx context.Context, token string) (*models.User, error)
	Logout(ctx context.Context, token string) error
	GetAllUsers(ctx context.Context) ([]models.User, error)
	CreateUser(ctx context.Context, username, password, name, role string, branchID *uint) (*models.User, error)
	UpdateUser(ctx context.Context, id uint, username, password, name, role string, branchID *uint) (*models.User, error)
	DeleteUser(ctx context.Context, id uint) error
}

type authService struct {
	userRepo repositories.UserRepository
}

func NewAuthService(userRepo repositories.UserRepository) AuthService {
	return &authService{userRepo: userRepo}
}

func (s *authService) Login(ctx context.Context, username, password string) (*models.LoginResponse, error) {
	user, err := s.userRepo.GetByUsername(ctx, username)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, models.NewAPIError(models.ErrUnauthorized, "Username atau password salah", 401)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, models.NewAPIError(models.ErrUnauthorized, "Username atau password salah", 401)
	}

	token := generateToken()
	expiresAt := time.Now().Add(24 * time.Hour)
	user.Token = token
	user.TokenExpiresAt = &expiresAt
	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}

	resp := &models.LoginResponse{
		Token: token,
		User:  *user,
	}
	resp.User.Password = ""
	resp.User.Token = ""
	return resp, nil
}

func (s *authService) Me(ctx context.Context, token string) (*models.User, error) {
	user, err := s.userRepo.GetByToken(ctx, token)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, models.NewAPIError(models.ErrUnauthorized, "Token tidak valid", 401)
	}

	if user.TokenExpiresAt != nil && time.Now().After(*user.TokenExpiresAt) {
		user.Token = ""
		user.TokenExpiresAt = nil
		s.userRepo.Update(ctx, user)
		return nil, models.NewAPIError(models.ErrUnauthorized, "Token sudah kadaluarsa", 401)
	}

	user.Password = ""
	user.Token = ""
	return user, nil
}

func (s *authService) Logout(ctx context.Context, token string) error {
	user, err := s.userRepo.GetByToken(ctx, token)
	if err != nil {
		return err
	}
	if user == nil {
		return nil
	}
	user.Token = ""
	user.TokenExpiresAt = nil
	return s.userRepo.Update(ctx, user)
}

func (s *authService) GetAllUsers(ctx context.Context) ([]models.User, error) {
	users, err := s.userRepo.GetAll(ctx)
	if err != nil {
		return nil, err
	}
	for i := range users {
		users[i].Password = ""
		users[i].Token = ""
	}
	return users, nil
}

func (s *authService) CreateUser(ctx context.Context, username, password, name, role string, branchID *uint) (*models.User, error) {
	if username == "" || password == "" || name == "" {
		return nil, models.NewAPIError(models.ErrInvalidInput, "Username, password, dan nama wajib diisi", 400)
	}

	count, err := s.userRepo.CountByUsername(ctx, username, 0)
	if err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, models.NewAPIError(models.ErrConflict, "Username sudah digunakan", 409)
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, models.NewAPIError(models.ErrInternalError, "Gagal mengenkripsi password", 500)
	}

	if role != "owner" && role != "cashier" {
		role = "cashier"
	}

	user := &models.User{
		Username: username,
		Password: string(hashed),
		Name:     name,
		Role:     role,
		BranchID: branchID,
	}
	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, models.NewAPIError(models.ErrInternalError, "Gagal membuat user", 500)
	}

	user.Password = ""
	user.Token = ""
	return user, nil
}

func (s *authService) UpdateUser(ctx context.Context, id uint, username, password, name, role string, branchID *uint) (*models.User, error) {
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, models.NewAPIError(models.ErrNotFound, "User tidak ditemukan", 404)
	}

	if username != "" && username != user.Username {
		count, err := s.userRepo.CountByUsername(ctx, username, id)
		if err != nil {
			return nil, err
		}
		if count > 0 {
			return nil, models.NewAPIError(models.ErrConflict, "Username sudah digunakan", 409)
		}
		user.Username = username
	}

	if name != "" {
		user.Name = name
	}
	if password != "" {
		hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return nil, models.NewAPIError(models.ErrInternalError, "Gagal mengenkripsi password", 500)
		}
		user.Password = string(hashed)
	}
	if role == "owner" || role == "cashier" {
		user.Role = role
	}
	if branchID != nil {
		user.BranchID = branchID
	}

	// #10: Invalidate token on password change
	if password != "" {
		user.Token = ""
		user.TokenExpiresAt = nil
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, models.NewAPIError(models.ErrInternalError, "Gagal update user", 500)
	}

	user.Password = ""
	user.Token = ""
	return user, nil
}

func (s *authService) DeleteUser(ctx context.Context, id uint) error {
	if id == 1 {
		return models.NewAPIError(models.ErrForbidden, "Tidak bisa menghapus admin utama", 403)
	}

	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if user == nil {
		return models.NewAPIError(models.ErrNotFound, "User tidak ditemukan", 404)
	}

	// #5: Clear token before delete
	user.Token = ""
	user.TokenExpiresAt = nil
	s.userRepo.Update(ctx, user)

	return s.userRepo.Delete(ctx, id)
}

func generateToken() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		h := sha256.Sum256([]byte(fmt.Sprintf("%d", time.Now().UnixNano())))
		return hex.EncodeToString(h[:])
	}
	h := sha256.Sum256(b)
	return hex.EncodeToString(h[:])
}
