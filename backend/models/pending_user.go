package models

import (
	"time"
)

// PendingUser представляет заявку на получение доступа
type PendingUser struct {
	TelegramID  string    `json:"telegram_id" db:"telegram_id"`
	Name        string    `json:"name" db:"name"`
	Username    string    `json:"username" db:"username"`
	RequestedAt time.Time `json:"requested_at" db:"requested_at"`
}

// CreatePendingUserRequest запрос на создание заявки
type CreatePendingUserRequest struct {
	TelegramID string `json:"telegramId" validate:"required"`
	Name       string `json:"name" validate:"required,min=2,max=100"`
	Username   string `json:"username" validate:"max=50"`
}

// PendingUserResponse ответ с данными заявки
type PendingUserResponse struct {
	TelegramID  string    `json:"telegram_id"`
	Name        string    `json:"name"`
	Username    string    `json:"username"`
	RequestedAt time.Time `json:"requested_at"`
}

// PendingUsersMap карта заявок по Telegram ID
type PendingUsersMap map[string]PendingUserResponse 