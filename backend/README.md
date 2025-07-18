# 📅 Calendar API - Go Backend

Backend API для календаря дежурств, написанный на Go.

## 🚀 Быстрый старт

### Предварительные требования

1. **Go 1.21+** - [golang.org/dl](https://golang.org/dl/)
2. **PostgreSQL** - база данных
3. **Переменные окружения** - скопируйте `env.example` в `.env`

### Установка и запуск

```bash
# Клонирование и переход в папку
cd backend

# Установка зависимостей
go mod tidy

# Копирование конфигурации
copy env.example .env

# Редактирование .env файла
# Укажите параметры подключения к БД и API ключ

# Запуск сервера
go run main.go
```

## 📁 Структура проекта

```
backend/
├── main.go              # Точка входа приложения
├── config/              # Конфигурация
├── handlers/            # HTTP обработчики
├── middleware/          # Middleware (CORS, auth, rate limiting)
├── models/              # Структуры данных
├── services/            # Бизнес-логика
├── db/                  # Работа с базой данных
├── utils/               # Утилиты
├── go.mod               # Зависимости Go
├── env.example          # Пример конфигурации
└── README.md            # Этот файл
```

## 🔧 API Endpoints

### Health Check
- `GET /health` - проверка состояния сервера

### Пользователи (пока не реализовано)
- `GET /users` - все пользователи
- `GET /users/{telegramId}` - пользователь по ID
- `POST /users` - создание/обновление пользователя
- `DELETE /users/{telegramId}` - удаление пользователя

### Календарь (пока не реализовано)
- `GET /months/{monthId}` - данные месяца
- `PUT /months/{monthId}` - сохранение данных

### Заявки (пока не реализовано)
- `GET /pending-users` - все заявки
- `POST /pending-users` - создание заявки
- `DELETE /pending-users/{telegramId}` - удаление заявки

## 🔐 Безопасность

- **API ключи** - аутентификация запросов
- **CORS** - ограничение доступа по доменам
- **Rate limiting** - защита от DDoS
- **Валидация** - проверка входных данных

## 🛠️ Разработка

```bash
# Запуск в режиме разработки
go run main.go

# Сборка для продакшена
go build -o calendar-api main.go

# Запуск тестов (когда будут добавлены)
go test ./...
```

## 📊 Мониторинг

- Логи выводятся в консоль
- Health check endpoint для проверки состояния
- Структурированное логирование

## 🔄 Следующие шаги

1. ✅ Базовая структура проекта
2. 🔄 Подключение к PostgreSQL
3. 🔄 Реализация endpoints
4. 🔄 Middleware (auth, rate limiting)
5. 🔄 Тесты
6. �� Документация API 