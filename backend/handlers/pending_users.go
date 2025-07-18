package handlers

import (
	"net/http"

	"calendar-api/services"
	"calendar-api/utils"

	"github.com/gorilla/mux"
)

// GetPendingUserByIDHandler обрабатывает GET /pending-users/{id}
func GetPendingUserByIDHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	pendingUser, err := services.GetPendingUserByID(id)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	if pendingUser == nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Pending user not found")
		return
	}

	utils.SuccessResponse(w, http.StatusOK, pendingUser)
}

// GetAllPendingUsersHandler обрабатывает GET /pending-users
func GetAllPendingUsersHandler(w http.ResponseWriter, r *http.Request) {
	pendingUsers, err := services.GetAllPendingUsers()
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(w, http.StatusOK, pendingUsers)
}

// CreatePendingUserHandler обрабатывает POST /pending-users
func CreatePendingUserHandler(w http.ResponseWriter, r *http.Request) {
	var request struct {
		TelegramID string `json:"telegramId"`
		Name       string `json:"name"`
		Username   string `json:"username"`
	}

	if err := utils.ParseJSONBody(r, &request); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	pendingUser, err := services.CreatePendingUser(request.TelegramID, request.Name, request.Username)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusCreated, pendingUser)
}

// DeletePendingUserHandler обрабатывает DELETE /pending-users/{telegramId}
func DeletePendingUserHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	telegramID := vars["telegramId"]

	err := services.DeletePendingUser(telegramID)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, map[string]string{"message": "Access request deleted successfully"})
}
