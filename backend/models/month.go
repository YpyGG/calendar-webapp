package models

import (
	"encoding/json"
	"time"
)

// Assignment представляет назначение в календаре
type Assignment struct {
	Person string `json:"person"`
	Shift  string `json:"shift"`
}

// Month представляет данные календаря за месяц
type Month struct {
	ID              string          `json:"id" db:"id"`
	Duties          json.RawMessage `json:"duties" db:"duties"`
	TechDuties      json.RawMessage `json:"tech_duties" db:"tech_duties"`
	GeneralSchedule json.RawMessage `json:"general_schedule" db:"general_schedule"`
	Colors          json.RawMessage `json:"colors" db:"colors"`
	CreatedAt       time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at" db:"updated_at"`
}

// CreateMonthRequest запрос на создание/обновление месяца
type CreateMonthRequest struct {
	Duties          map[string]string       `json:"duties"`
	TechDuties      map[string][]Assignment `json:"techDuties"`
	GeneralSchedule map[string][]Assignment `json:"generalSchedule"`
	Colors          map[string]string       `json:"colors"`
}

// MonthResponse ответ с данными месяца
type MonthResponse struct {
	ID              string                  `json:"id"`
	Duties          map[string]string       `json:"duties"`
	TechDuties      map[string][]Assignment `json:"techDuties"`
	GeneralSchedule map[string][]Assignment `json:"generalSchedule"`
	Colors          map[string]string       `json:"colors"`
	CreatedAt       time.Time               `json:"createdAt"`
	UpdatedAt       time.Time               `json:"updatedAt"`
}
