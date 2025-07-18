# Backend API для календаря дежурств

Этот backend API развертывается на Яндекс.Облаке Cloud Functions и предоставляет REST API для управления календарем дежурств.

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Скопируйте `env.example` в `.env` и заполните ваши данные:

```bash
cp env.example .env
```

### 3. Локальная разработка

```bash
npm start
```

API будет доступен на `http://localhost:3000`

## 📋 API Endpoints

### Аутентификация
Все запросы должны содержать заголовок:
```
Authorization: Bearer YOUR_API_KEY
```

### Пользователи

#### `GET /users/:telegramId`
Получение пользователя по Telegram ID

#### `GET /users`
Получение всех активных пользователей

#### `POST /users`
Создание/обновление пользователя
```json
{
  "telegramId": "123456789",
  "name": "Иван Иванов",
  "role": "worker",
  "active": true
}
```

#### `DELETE /users/:telegramId`
Удаление пользователя

### Данные календаря

#### `GET /months/:monthId`
Получение данных месяца (формат: `2024_0`)

#### `PUT /months/:monthId`
Сохранение данных месяца
```json
{
  "duties": {"1": "Иванов И.И."},
  "techDuties": {"1": [{"person": "Петров П.П.", "shift": "8"}]},
  "generalSchedule": {"1": [{"person": "Сидоров С.С.", "shift": "ДС"}]},
  "colors": {"1": "#ff0000"}
}
```

### Заявки на доступ

#### `GET /pending-users`
Получение всех заявок на доступ

#### `POST /pending-users`
Создание заявки на доступ
```json
{
  "telegramId": "123456789",
  "name": "Новый пользователь",
  "username": "newuser"
}
```

#### `DELETE /pending-users/:telegramId`
Удаление заявки на доступ

### Health Check

#### `GET /health`
Проверка состояния API

## 🔧 Развертывание на Яндекс.Облаке

### 1. Установка Yandex Cloud CLI

```bash
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
```

### 2. Инициализация

```bash
yc init
```

### 3. Создание функции

```bash
yc serverless function create --name calendar-api
```

### 4. Создание версии функции

```bash
yc serverless function version create \
  --function-name calendar-api \
  --runtime nodejs16 \
  --entrypoint index.handler \
  --memory 128m \
  --execution-timeout 30s \
  --source-path . \
  --environment-variables API_KEY=your-api-key,DB_HOST=your-db-host,DB_NAME=your-db-name,DB_USER=your-db-user,DB_PASSWORD=your-db-password,DB_SSL=true
```

### 5. Создание HTTP триггера

```bash
yc serverless trigger create http \
  --name calendar-api-trigger \
  --function-name calendar-api \
  --function-tag latest
```

## 🗄️ Настройка базы данных

### 1. Создание кластера PostgreSQL

В консоли Яндекс.Облака создайте кластер Managed Service for PostgreSQL.

### 2. Выполнение SQL скрипта

Подключитесь к базе данных и выполните `database.sql`:

```bash
psql -h your-db-host -U your-db-user -d your-db-name -f database.sql
```

### 3. Создание пользователя для приложения

```sql
CREATE USER calendar_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO calendar_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO calendar_user;
```

## 🔐 Безопасность

### API ключи
- Используйте сильные API ключи (минимум 32 символа)
- Храните ключи в переменных окружения
- Регулярно ротируйте ключи

### База данных
- Настройте SSL соединения
- Используйте отдельного пользователя для приложения
- Ограничьте доступ по IP в настройках кластера

### CORS
Настройте `ALLOWED_ORIGINS` для ваших доменов.

## 📊 Мониторинг

### Логи
Логи доступны в консоли Яндекс.Облака:
- Cloud Functions → calendar-api → Логи

### Метрики
- Количество вызовов
- Время выполнения
- Ошибки

## 🚨 Обработка ошибок

API возвращает стандартные HTTP коды:

- `200` - Успешный запрос
- `400` - Неверные данные
- `401` - Неверный API ключ
- `404` - Ресурс не найден
- `409` - Конфликт (например, дублирование)
- `500` - Внутренняя ошибка сервера

## 🔄 Обновление функции

```bash
# Создание новой версии
yc serverless function version create \
  --function-name calendar-api \
  --runtime nodejs16 \
  --entrypoint index.handler \
  --memory 128m \
  --execution-timeout 30s \
  --source-path . \
  --environment-variables API_KEY=your-api-key,DB_HOST=your-db-host,DB_NAME=your-db-name,DB_USER=your-db-user,DB_PASSWORD=your-db-password,DB_SSL=true

# Обновление триггера
yc serverless trigger update http calendar-api-trigger \
  --function-name calendar-api \
  --function-tag latest
```

## 💰 Стоимость

### Бесплатный тариф:
- 1,000,000 вызовов в месяц
- 5 ГБ-секунд выполнения

### Платный тариф:
- ~0.5₽ за 1000 вызовов
- ~0.5₽ за ГБ-секунду выполнения

## 📞 Поддержка

- [Документация Яндекс.Облака](https://cloud.yandex.ru/docs/functions/)
- [Telegram сообщество](https://t.me/yandexcloud) 