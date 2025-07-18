package models

import (
	"time"
)

// User представляет пользователя системы
type User struct {
	TelegramID string    `json:"telegram_id" db:"telegram_id"`
	Name       string    `json:"name" db:"name"`
	Role       string    `json:"role" db:"role"`
	Active     bool      `json:"active" db:"active"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
}

// CreateUserRequest представляет запрос на создание пользователя
type CreateUserRequest struct {
	TelegramID string `json:"telegramId" validate:"required"`
	Name       string `json:"name" validate:"required,min=2,max=100"`
	Role       string `json:"role" validate:"required,oneof=admin boss worker guest"`
	Active     bool   `json:"active"`
}

// UpdateUserRequest представляет запрос на обновление пользователя
type UpdateUserRequest struct {
	Name   string `json:"name" validate:"required,min=2,max=100"`
	Role   string `json:"role" validate:"required,oneof=admin boss worker guest"`
	Active bool   `json:"active"`
}

// UserResponse ответ с данными пользователя
type UserResponse struct {
	TelegramID string    `json:"telegram_id"`
	Name       string    `json:"name"`
	Role       string    `json:"role"`
	Active     bool      `json:"active"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// UsersMap карта пользователей по Telegram ID
type UsersMap map[string]UserResponse
