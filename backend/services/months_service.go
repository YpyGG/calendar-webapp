package services

import (
	"calendar-api/db"
	"calendar-api/models"
	"encoding/json"
	"fmt"
	"time"
)

// GetMonthData возвращает данные месяца
func GetMonthData(yearMonth string) (*models.MonthResponse, error) {
	// Если база данных недоступна, возвращаем тестовые данные
	if db.DB == nil {
		return getTestMonthData(yearMonth), nil
	}

	var month models.Month
	err := db.DB.QueryRow(`SELECT id, duties, tech_duties, general_schedule, colors, created_at, updated_at FROM months WHERE id = $1`, yearMonth).
		Scan(&month.ID, &month.Duties, &month.TechDuties, &month.GeneralSchedule, &month.Colors, &month.CreatedAt, &month.UpdatedAt)
	if err != nil {
		// Если данные не найдены, возвращаем пустые данные
		return &models.MonthResponse{
			ID:              yearMonth,
			Duties:          make(map[string]string),
			TechDuties:      make(map[string][]models.Assignment),
			GeneralSchedule: make(map[string][]models.Assignment),
			Colors:          make(map[string]string),
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		}, nil
	}

	// Парсим JSON данные
	var duties map[string]string
	var techDuties map[string][]models.Assignment
	var generalSchedule map[string][]models.Assignment
	var colors map[string]string

	if month.Duties != nil {
		json.Unmarshal(month.Duties, &duties)
	}
	if month.TechDuties != nil {
		json.Unmarshal(month.TechDuties, &techDuties)
	}
	if month.GeneralSchedule != nil {
		json.Unmarshal(month.GeneralSchedule, &generalSchedule)
	}
	if month.Colors != nil {
		json.Unmarshal(month.Colors, &colors)
	}

	return &models.MonthResponse{
		ID:              month.ID,
		Duties:          duties,
		TechDuties:      techDuties,
		GeneralSchedule: generalSchedule,
		Colors:          colors,
		CreatedAt:       month.CreatedAt,
		UpdatedAt:       month.UpdatedAt,
	}, nil
}

// UpdateMonthData обновляет данные месяца
func UpdateMonthData(yearMonth string, duties map[string]string, techDuties map[string][]models.Assignment, generalSchedule map[string][]models.Assignment, colors map[string]string) error {
	// Если база данных недоступна, просто возвращаем успех
	if db.DB == nil {
		return nil
	}

	// Сериализуем данные в JSON
	dutiesJSON, _ := json.Marshal(duties)
	techDutiesJSON, _ := json.Marshal(techDuties)
	generalScheduleJSON, _ := json.Marshal(generalSchedule)
	colorsJSON, _ := json.Marshal(colors)

	_, err := db.DB.Exec(`
		INSERT INTO months (id, duties, tech_duties, general_schedule, colors, updated_at) 
		VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) 
		ON CONFLICT (id) 
		DO UPDATE SET 
			duties = $2, 
			tech_duties = $3, 
			general_schedule = $4, 
			colors = $5, 
			updated_at = CURRENT_TIMESTAMP`,
		yearMonth, dutiesJSON, techDutiesJSON, generalScheduleJSON, colorsJSON)

	return err
}

// getTestMonthData возвращает тестовые данные месяца
func getTestMonthData(yearMonth string) *models.MonthResponse {
	duties := make(map[string]string)
	techDuties := make(map[string][]models.Assignment)
	generalSchedule := make(map[string][]models.Assignment)

	// Заполняем тестовыми данными для всех дней месяца
	for i := 1; i <= 31; i++ {
		key := fmt.Sprintf("%d", i)
		duties[key] = "Морозов В.А."
		techDuties[key] = []models.Assignment{
			{Person: "Ребраков Т.В.", Shift: "8"},
		}
		generalSchedule[key] = []models.Assignment{
			{Person: "Костырин С.С.", Shift: "ДС"},
		}
	}

	return &models.MonthResponse{
		ID:              yearMonth,
		Duties:          duties,
		TechDuties:      techDuties,
		GeneralSchedule: generalSchedule,
		Colors: map[string]string{
			"Морозов В.А.":  "#FF6B6B",
			"Ребраков Т.В.": "#4ECDC4",
			"Костырин С.С.": "#45B7D1",
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}
