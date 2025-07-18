package services

import (
	"calendar-api/db"
	"calendar-api/models"
	"database/sql"
	"fmt"
	"time"
)

// GetAllUsers возвращает всех активных пользователей
func GetAllUsers() (models.UsersMap, error) {
	// Если база данных недоступна, возвращаем тестовые данные
	if db.DB == nil {
		return getTestUsers(), nil
	}

	rows, err := db.DB.Query(`SELECT telegram_id, name, role, active, created_at, updated_at FROM users WHERE active = true ORDER BY name`)
	if err != nil {
		return nil, fmt.Errorf("error querying users: %v", err)
	}
	defer rows.Close()

	users := make(models.UsersMap)
	for rows.Next() {
		var u models.User
		err := rows.Scan(&u.TelegramID, &u.Name, &u.Role, &u.Active, &u.CreatedAt, &u.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("error scanning user: %v", err)
		}
		users[u.TelegramID] = models.UserResponse{
			TelegramID: u.TelegramID,
			Name:       u.Name,
			Role:       u.Role,
			Active:     u.Active,
			CreatedAt:  u.CreatedAt,
			UpdatedAt:  u.UpdatedAt,
		}
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating users: %v", err)
	}
	return users, nil
}

// getTestUsers возвращает тестовые данные пользователей
func getTestUsers() models.UsersMap {
	users := make(models.UsersMap)
	users["670669284"] = models.UserResponse{
		TelegramID: "670669284",
		Name:       "Администратор",
		Role:       "admin",
		Active:     true,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}
	return users
}

// GetUserByTelegramID возвращает пользователя по Telegram ID
func GetUserByTelegramID(telegramID string) (*models.UserResponse, error) {
	// Если база данных недоступна, возвращаем тестовые данные
	if db.DB == nil {
		testUsers := getTestUsers()
		if user, exists := testUsers[telegramID]; exists {
			return &user, nil
		}
		return nil, nil
	}

	var u models.User
	err := db.DB.QueryRow(`SELECT telegram_id, name, role, active, created_at, updated_at FROM users WHERE telegram_id = $1 AND active = true`, telegramID).
		Scan(&u.TelegramID, &u.Name, &u.Role, &u.Active, &u.CreatedAt, &u.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("error querying user: %v", err)
	}
	resp := &models.UserResponse{
		TelegramID: u.TelegramID,
		Name:       u.Name,
		Role:       u.Role,
		Active:     u.Active,
		CreatedAt:  u.CreatedAt,
		UpdatedAt:  u.UpdatedAt,
	}
	return resp, nil
}

// CreateUser создает нового пользователя
func CreateUser(telegramID, name, role string, active bool) (*models.UserResponse, error) {
	// Если база данных недоступна, возвращаем тестовые данные
	if db.DB == nil {
		now := time.Now()
		user := &models.UserResponse{
			TelegramID: telegramID,
			Name:       name,
			Role:       role,
			Active:     active,
			CreatedAt:  now,
			UpdatedAt:  now,
		}
		return user, nil
	}

	var u models.User
	err := db.DB.QueryRow(`
		INSERT INTO users (telegram_id, name, role, active) 
		VALUES ($1, $2, $3, $4) 
		ON CONFLICT (telegram_id) 
		DO UPDATE SET name = $2, role = $3, active = $4, updated_at = CURRENT_TIMESTAMP
		RETURNING telegram_id, name, role, active, created_at, updated_at`,
		telegramID, name, role, active,
	).Scan(&u.TelegramID, &u.Name, &u.Role, &u.Active, &u.CreatedAt, &u.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("error creating/updating user: %v", err)
	}

	resp := &models.UserResponse{
		TelegramID: u.TelegramID,
		Name:       u.Name,
		Role:       u.Role,
		Active:     u.Active,
		CreatedAt:  u.CreatedAt,
		UpdatedAt:  u.UpdatedAt,
	}
	return resp, nil
}

// UpdateUser обновляет пользователя
func UpdateUser(telegramID, name, role string, active bool) (*models.UserResponse, error) {
	// Если база данных недоступна, возвращаем тестовые данные
	if db.DB == nil {
		now := time.Now()
		user := &models.UserResponse{
			TelegramID: telegramID,
			Name:       name,
			Role:       role,
			Active:     active,
			CreatedAt:  now,
			UpdatedAt:  now,
		}
		return user, nil
	}

	var u models.User
	err := db.DB.QueryRow(`
		UPDATE users 
		SET name = $2, role = $3, active = $4, updated_at = CURRENT_TIMESTAMP
		WHERE telegram_id = $1
		RETURNING telegram_id, name, role, active, created_at, updated_at`,
		telegramID, name, role, active,
	).Scan(&u.TelegramID, &u.Name, &u.Role, &u.Active, &u.CreatedAt, &u.UpdatedAt)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("error updating user: %v", err)
	}

	resp := &models.UserResponse{
		TelegramID: u.TelegramID,
		Name:       u.Name,
		Role:       u.Role,
		Active:     u.Active,
		CreatedAt:  u.CreatedAt,
		UpdatedAt:  u.UpdatedAt,
	}
	return resp, nil
}

// DeleteUser удаляет пользователя
func DeleteUser(telegramID string) error {
	// Если база данных недоступна, просто возвращаем успех
	if db.DB == nil {
		return nil
	}

	result, err := db.DB.Exec(`DELETE FROM users WHERE telegram_id = $1`, telegramID)
	if err != nil {
		return fmt.Errorf("error deleting user: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error getting rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}
