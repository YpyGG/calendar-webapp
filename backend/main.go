package main

import (
	"calendar-api/db"
	"calendar-api/handlers"
	"calendar-api/middleware"
	"calendar-api/utils"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

// initConfig устанавливает переменные окружения для локальной разработки
func initConfig() {
	// Устанавливаем значения по умолчанию для локальной разработки
	if os.Getenv("DB_HOST") == "" {
		os.Setenv("DB_HOST", "localhost")
	}
	if os.Getenv("DB_PORT") == "" {
		os.Setenv("DB_PORT", "5432")
	}
	if os.Getenv("DB_NAME") == "" {
		os.Setenv("DB_NAME", "postgres")
	}
	if os.Getenv("DB_USER") == "" {
		os.Setenv("DB_USER", "postgres")
	}
	if os.Getenv("DB_PASSWORD") == "" {
		os.Setenv("DB_PASSWORD", "postgres")
	}
	if os.Getenv("DB_SSL_MODE") == "" {
		os.Setenv("DB_SSL_MODE", "disable")
	}
	if os.Getenv("API_KEY") == "" {
		os.Setenv("API_KEY", "test-api-key")
	}
	if os.Getenv("PORT") == "" {
		os.Setenv("PORT", "8080")
	}
	if os.Getenv("ALLOWED_ORIGINS") == "" {
		os.Setenv("ALLOWED_ORIGINS", "http://localhost:3000")
	}
}

func main() {
	// Инициализируем конфигурацию
	initConfig()

	// Загружаем переменные окружения
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using default config")
	}

	// Временно отключаем инициализацию базы данных для тестирования
	// if err := db.InitDB(); err != nil {
	// 	log.Printf("Warning: Failed to initialize database: %v", err)
	// 	log.Println("Server will start without database connection")
	// } else {
	// 	defer db.CloseDB()
	// }
	log.Println("Database initialization disabled - using test data only")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r := mux.NewRouter()

	// CORS должен быть первым!
	r.Use(corsMiddleware)
	// Middleware: логирование
	r.Use(loggingMiddleware)
	// Middleware: аутентификация
	r.Use(middleware.AuthMiddleware)

	// Health check
	r.HandleFunc("/health", healthHandler).Methods("GET")

	// Users endpoints
	r.HandleFunc("/users", handlers.GetAllUsersHandler).Methods("GET")
	r.HandleFunc("/users", handlers.CreateUserHandler).Methods("POST")
	r.HandleFunc("/users/{telegramId}", handlers.GetUserByTelegramIDHandler).Methods("GET")
	r.HandleFunc("/users/{telegramId}", handlers.UpdateUserHandler).Methods("PUT")
	r.HandleFunc("/users/{telegramId}", handlers.DeleteUserHandler).Methods("DELETE")

	// Pending users endpoints
	r.HandleFunc("/pending-users", handlers.GetAllPendingUsersHandler).Methods("GET")
	r.HandleFunc("/pending-users", handlers.CreatePendingUserHandler).Methods("POST")
	r.HandleFunc("/pending-users/{telegramId}", handlers.GetPendingUserByIDHandler).Methods("GET")
	r.HandleFunc("/pending-users/{telegramId}", handlers.DeletePendingUserHandler).Methods("DELETE")

	// Months endpoints
	r.HandleFunc("/months/{yearMonth}", handlers.GetMonthDataHandler).Methods("GET")
	r.HandleFunc("/months/{yearMonth}", handlers.UpdateMonthDataHandler).Methods("PUT")

	// OPTIONS handlers для CORS preflight
	r.HandleFunc("/users", func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusNoContent) }).Methods("OPTIONS")
	r.HandleFunc("/users/{telegramId}", func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusNoContent) }).Methods("OPTIONS")
	r.HandleFunc("/pending-users", func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusNoContent) }).Methods("OPTIONS")
	r.HandleFunc("/pending-users/{telegramId}", func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusNoContent) }).Methods("OPTIONS")
	r.HandleFunc("/months/{yearMonth}", func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusNoContent) }).Methods("OPTIONS")

	// NotFound handler для CORS
	r.NotFoundHandler = http.HandlerFunc(notFoundHandler)

	log.Printf("Server running on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

// healthHandler обрабатывает health check
func healthHandler(w http.ResponseWriter, r *http.Request) {
	dbStatus := "connected"
	if db.DB == nil {
		dbStatus = "not_initialized"
	} else if err := db.HealthCheck(); err != nil {
		dbStatus = "disconnected"
	}

	if dbStatus == "connected" {
		utils.HealthResponse(w, "healthy", dbStatus)
	} else {
		utils.HealthResponse(w, "degraded", dbStatus)
	}
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s %s", r.Method, r.RequestURI, r.RemoteAddr)
		next.ServeHTTP(w, r)
	})
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func notFoundHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotFound)
	w.Write([]byte(`{"status":"error","error":"Not found"}`))
}
