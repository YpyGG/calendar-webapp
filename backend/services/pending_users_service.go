package services

import (
	"calendar-api/db"
	"calendar-api/models"
	"database/sql"
	"fmt"
	"time"
)

// GetPendingUserByID возвращает заявку по ID
func GetPendingUserByID(id string) (*models.PendingUserResponse, error) {
	// Если база данных недоступна, возвращаем тестовые данные
	if db.DB == nil {
		testPendingUsers := getTestPendingUsers()
		if user, exists := testPendingUsers[id]; exists {
			return &user, nil
		}
		return nil, nil
	}

	var p models.PendingUser
	err := db.DB.QueryRow(`SELECT telegram_id, name, username, requested_at FROM pending_users WHERE telegram_id = $1`, id).
		Scan(&p.TelegramID, &p.Name, &p.Username, &p.RequestedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("error querying pending user: %v", err)
	}

	resp := &models.PendingUserResponse{
		TelegramID:  p.TelegramID,
		Name:        p.Name,
		Username:    p.Username,
		RequestedAt: p.RequestedAt,
	}
	return resp, nil
}

// GetAllPendingUsers возвращает все заявки
func GetAllPendingUsers() (models.PendingUsersMap, error) {
	// Если база данных недоступна, возвращаем тестовые данные
	if db.DB == nil {
		return getTestPendingUsers(), nil
	}

	rows, err := db.DB.Query(`SELECT telegram_id, name, username, requested_at FROM pending_users ORDER BY requested_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("error querying pending users: %v", err)
	}
	defer rows.Close()

	pendingUsers := make(models.PendingUsersMap)
	for rows.Next() {
		var p models.PendingUser
		err := rows.Scan(&p.TelegramID, &p.Name, &p.Username, &p.RequestedAt)
		if err != nil {
			return nil, fmt.Errorf("error scanning pending user: %v", err)
		}
		pendingUsers[p.TelegramID] = models.PendingUserResponse{
			TelegramID:  p.TelegramID,
			Name:        p.Name,
			Username:    p.Username,
			RequestedAt: p.RequestedAt,
		}
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating pending users: %v", err)
	}
	return pendingUsers, nil
}

// CreatePendingUser создает новую заявку
func CreatePendingUser(telegramID, name, username string) (*models.PendingUserResponse, error) {
	// Если база данных недоступна, возвращаем тестовые данные
	if db.DB == nil {
		now := time.Now()
		pendingUser := models.PendingUserResponse{
			TelegramID:  telegramID,
			Name:        name,
			Username:    username,
			RequestedAt: now,
		}
		return &pendingUser, nil
	}

	var p models.PendingUser
	err := db.DB.QueryRow(`INSERT INTO pending_users (telegram_id, name, username, requested_at) VALUES ($1, $2, $3, $4) RETURNING telegram_id, name, username, requested_at`,
		telegramID, name, username, time.Now()).
		Scan(&p.TelegramID, &p.Name, &p.Username, &p.RequestedAt)
	if err != nil {
		return nil, fmt.Errorf("error creating pending user: %v", err)
	}

	resp := &models.PendingUserResponse{
		TelegramID:  p.TelegramID,
		Name:        p.Name,
		Username:    p.Username,
		RequestedAt: p.RequestedAt,
	}
	return resp, nil
}

// DeletePendingUser удаляет заявку на доступ
func DeletePendingUser(telegramID string) error {
	// Если база данных недоступна, просто возвращаем успех
	if db.DB == nil {
		return nil
	}

	result, err := db.DB.Exec(`DELETE FROM pending_users WHERE telegram_id = $1`, telegramID)
	if err != nil {
		return fmt.Errorf("error deleting pending user: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error getting rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("pending user not found")
	}

	return nil
}

// getTestPendingUsers возвращает тестовые данные заявок
func getTestPendingUsers() models.PendingUsersMap {
	pendingUsers := make(models.PendingUsersMap)
	pendingUsers["123456789"] = models.PendingUserResponse{
		TelegramID:  "123456789",
		Name:        "Тестовый пользователь",
		Username:    "testuser",
		RequestedAt: time.Now(),
	}
	return pendingUsers
}
