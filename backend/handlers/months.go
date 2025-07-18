package handlers

import (
	"net/http"

	"calendar-api/models"
	"calendar-api/services"
	"calendar-api/utils"

	"github.com/gorilla/mux"
)

// GetMonthDataHandler обрабатывает GET /months/{year}_{month}
func GetMonthDataHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	yearMonth := vars["yearMonth"] // формат: "2025_6"

	monthData, err := services.GetMonthData(yearMonth)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, monthData)
}

// UpdateMonthDataHandler обрабатывает PUT /months/{year}_{month}
func UpdateMonthDataHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	yearMonth := vars["yearMonth"] // формат: "2025_6"

	var request models.CreateMonthRequest

	if err := utils.ParseJSONBody(r, &request); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	err := services.UpdateMonthData(yearMonth, request.Duties, request.TechDuties, request.GeneralSchedule, request.Colors)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, map[string]string{"message": "Month data updated successfully"})
}
