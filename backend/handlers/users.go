package handlers

import (
	"net/http"

	"calendar-api/models"
	"calendar-api/services"
	"calendar-api/utils"

	"github.com/gorilla/mux"
)

// GetAllUsersHandler обрабатывает GET /users
func GetAllUsersHandler(w http.ResponseWriter, r *http.Request) {
	users, err := services.GetAllUsers()
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(w, http.StatusOK, users)
}

// GetUserByTelegramIDHandler обрабатывает GET /users/{telegramId}
func GetUserByTelegramIDHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	telegramID := vars["telegramId"]

	user, err := services.GetUserByTelegramID(telegramID)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	if user == nil {
		utils.ErrorResponse(w, http.StatusNotFound, "User not found")
		return
	}

	utils.SuccessResponse(w, http.StatusOK, user)
}

// CreateUserHandler обрабатывает POST /users
func CreateUserHandler(w http.ResponseWriter, r *http.Request) {
	var request models.CreateUserRequest

	if err := utils.ParseJSONBody(r, &request); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	user, err := services.CreateUser(request.TelegramID, request.Name, request.Role, request.Active)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusCreated, user)
}

// UpdateUserHandler обрабатывает PUT /users/{telegramId}
func UpdateUserHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	telegramID := vars["telegramId"]

	var request models.UpdateUserRequest

	if err := utils.ParseJSONBody(r, &request); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	user, err := services.UpdateUser(telegramID, request.Name, request.Role, request.Active)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	if user == nil {
		utils.ErrorResponse(w, http.StatusNotFound, "User not found")
		return
	}

	utils.SuccessResponse(w, http.StatusOK, user)
}

// DeleteUserHandler обрабатывает DELETE /users/{telegramId}
func DeleteUserHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	telegramID := vars["telegramId"]

	err := services.DeleteUser(telegramID)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, map[string]string{"message": "User deleted successfully"})
}
