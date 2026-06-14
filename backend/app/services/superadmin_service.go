package services

import (
	"context"
	"point-of-sale/backend/app/models"
	"point-of-sale/backend/app/repositories"
)

type SuperadminService interface {
	GetRevenueDashboard(ctx context.Context) (*repositories.RevenueStats, []repositories.MonthlyRevenue, error)
	GetAllOrders(ctx context.Context, page, limit int, merchantID uint, status, dateFrom, dateTo string) ([]models.Order, int64, error)
	GetOrderStats(ctx context.Context) (*repositories.OrderStats, error)
	GetRevenuePerMerchant(ctx context.Context, page, limit int) ([]repositories.MerchantRevenue, int64, error)
	GetPaymentTransactions(ctx context.Context, page, limit int, status string) ([]models.PaymentTransaction, int64, error)
	GetPaymentStats(ctx context.Context) (*repositories.PaymentStats, error)
	GetSystemHealth(ctx context.Context) (*repositories.SystemHealth, error)
	GetAuditLogs(ctx context.Context, page, limit int, action, userID string) ([]models.AuditLog, int64, error)
	GetPlatformSettings(ctx context.Context) (map[string]string, error)
	UpsertPlatformSetting(ctx context.Context, key, value string) error
	GetContactMessages(ctx context.Context, page, limit int, status string) ([]models.ContactMessage, int64, error)
	MarkContactRead(ctx context.Context, id uint, userID uint) error
	DeleteContactMessage(ctx context.Context, id uint) error
	CreateContactMessage(ctx context.Context, msg *models.ContactMessage) error
	GetTickets(ctx context.Context, page, limit int, status string) ([]models.Ticket, int64, error)
	GetTicketByID(ctx context.Context, id uint) (*models.Ticket, error)
	GetMyTickets(ctx context.Context, userID, merchantID uint) ([]models.Ticket, error)
	CreateTicket(ctx context.Context, userID, merchantID uint, req *models.CreateTicketRequest) (*models.Ticket, error)
	ReplyTicket(ctx context.Context, ticketID uint, senderName string, req *models.ReplyTicketRequest) (*models.TicketMessage, error)
	ReplyTicketAs(ctx context.Context, ticketID uint, sender, senderName string, req *models.ReplyTicketRequest) (*models.TicketMessage, error)
	UpdateTicketStatus(ctx context.Context, id uint, status string) error
	GetDemographics(ctx context.Context) (*repositories.DemographicsData, error)
	GetExportData(ctx context.Context, dateFrom, dateTo string) (*repositories.ExportData, error)
}

type superadminService struct {
	repo repositories.SuperadminRepository
}

func NewSuperadminService(repo repositories.SuperadminRepository) SuperadminService {
	return &superadminService{repo: repo}
}

func (s *superadminService) GetRevenueDashboard(ctx context.Context) (*repositories.RevenueStats, []repositories.MonthlyRevenue, error) {
	stats, err := s.repo.GetRevenueStats(ctx)
	if err != nil { return nil, nil, err }
	monthly, err := s.repo.GetMonthlyRevenue(ctx, 12)
	if err != nil { return nil, nil, err }
	return stats, monthly, nil
}

func (s *superadminService) GetAllOrders(ctx context.Context, page, limit int, merchantID uint, status, dateFrom, dateTo string) ([]models.Order, int64, error) {
	return s.repo.GetAllOrders(ctx, page, limit, merchantID, status, dateFrom, dateTo)
}
func (s *superadminService) GetOrderStats(ctx context.Context) (*repositories.OrderStats, error) { return s.repo.GetOrderStats(ctx) }
func (s *superadminService) GetRevenuePerMerchant(ctx context.Context, page, limit int) ([]repositories.MerchantRevenue, int64, error) { return s.repo.GetRevenuePerMerchant(ctx, page, limit) }
func (s *superadminService) GetPaymentTransactions(ctx context.Context, page, limit int, status string) ([]models.PaymentTransaction, int64, error) { return s.repo.GetPaymentTransactions(ctx, page, limit, status) }
func (s *superadminService) GetPaymentStats(ctx context.Context) (*repositories.PaymentStats, error) { return s.repo.GetPaymentStats(ctx) }
func (s *superadminService) GetSystemHealth(ctx context.Context) (*repositories.SystemHealth, error) { return s.repo.GetSystemHealth(ctx) }
func (s *superadminService) GetAuditLogs(ctx context.Context, page, limit int, action, userID string) ([]models.AuditLog, int64, error) { return s.repo.GetAuditLogs(ctx, page, limit, action, userID) }
func (s *superadminService) GetPlatformSettings(ctx context.Context) (map[string]string, error) { return s.repo.GetPlatformSettings(ctx) }
func (s *superadminService) UpsertPlatformSetting(ctx context.Context, key, value string) error { return s.repo.UpsertPlatformSetting(ctx, key, value) }
func (s *superadminService) GetContactMessages(ctx context.Context, page, limit int, status string) ([]models.ContactMessage, int64, error) { return s.repo.GetContactMessages(ctx, page, limit, status) }
func (s *superadminService) MarkContactRead(ctx context.Context, id uint, userID uint) error { return s.repo.MarkContactRead(ctx, id, userID) }
func (s *superadminService) DeleteContactMessage(ctx context.Context, id uint) error { return s.repo.DeleteContactMessage(ctx, id) }
func (s *superadminService) CreateContactMessage(ctx context.Context, msg *models.ContactMessage) error { return s.repo.CreateContactMessage(ctx, msg) }
func (s *superadminService) GetTickets(ctx context.Context, page, limit int, status string) ([]models.Ticket, int64, error) { return s.repo.GetTickets(ctx, page, limit, status) }
func (s *superadminService) GetTicketByID(ctx context.Context, id uint) (*models.Ticket, error) { return s.repo.GetTicketByID(ctx, id) }
func (s *superadminService) GetMyTickets(ctx context.Context, userID, merchantID uint) ([]models.Ticket, error) { return s.repo.GetMyTickets(ctx, userID, merchantID) }

func (s *superadminService) CreateTicket(ctx context.Context, userID, merchantID uint, req *models.CreateTicketRequest) (*models.Ticket, error) {
	t := &models.Ticket{
		Name: req.Name, Email: req.Email, Subject: req.Subject, Status: "open",
	}
	if userID > 0 { t.UserID = &userID }
	if merchantID > 0 { t.MerchantID = &merchantID }
	if err := s.repo.CreateTicket(ctx, t); err != nil { return nil, err }
	msg := &models.TicketMessage{
		TicketID: t.ID, Sender: "merchant", SenderName: req.Name, Message: req.Message,
	}
	if err := s.repo.AddTicketMessage(ctx, msg); err != nil { return nil, err }
	t.Messages = []models.TicketMessage{*msg}
	return t, nil
}

func (s *superadminService) UpdateTicketStatus(ctx context.Context, id uint, status string) error { return s.repo.UpdateTicketStatus(ctx, id, status) }
func (s *superadminService) GetDemographics(ctx context.Context) (*repositories.DemographicsData, error) { return s.repo.GetDemographics(ctx) }
func (s *superadminService) GetExportData(ctx context.Context, dateFrom, dateTo string) (*repositories.ExportData, error) { return s.repo.GetExportData(ctx, dateFrom, dateTo) }
func (s *superadminService) ReplyTicket(ctx context.Context, ticketID uint, senderName string, req *models.ReplyTicketRequest) (*models.TicketMessage, error) {
	return s.ReplyTicketAs(ctx, ticketID, "support", senderName, req)
}

func (s *superadminService) ReplyTicketAs(ctx context.Context, ticketID uint, sender, senderName string, req *models.ReplyTicketRequest) (*models.TicketMessage, error) {
	m := &models.TicketMessage{
		TicketID: ticketID, Sender: sender, SenderName: senderName,
		Message: req.Message, AttachmentURL: req.AttachmentURL,
	}
	if err := s.repo.AddTicketMessage(ctx, m); err != nil { return nil, err }
	s.repo.UpdateTicketStatus(ctx, ticketID, "replied")
	return m, nil
}
