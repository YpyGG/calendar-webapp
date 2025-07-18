package middleware

import (
	"net/http"
	"os"
	"strings"

	"calendar-api/utils"
)

// AuthMiddleware проверяет API ключ в заголовке Authorization
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Пропускаем health check и preflight (OPTIONS) без аутентификации
		if r.URL.Path == "/health" || r.Method == "OPTIONS" {
			next.ServeHTTP(w, r)
			return
		}

		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			utils.ErrorResponse(w, http.StatusUnauthorized, "Missing Authorization header")
			return
		}

		// Проверяем формат "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			utils.ErrorResponse(w, http.StatusUnauthorized, "Invalid Authorization header format")
			return
		}

		apiKey := parts[1]
		expectedAPIKey := os.Getenv("API_KEY")

		if expectedAPIKey == "" {
			utils.ErrorResponse(w, http.StatusInternalServerError, "API key not configured")
			return
		}

		if apiKey != expectedAPIKey {
			utils.ErrorResponse(w, http.StatusUnauthorized, "Invalid API key")
			return
		}

		next.ServeHTTP(w, r)
	})
}
