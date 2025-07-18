# Настройка Яндекс.Облака для замены Firebase

## 🎯 Обзор

Этот проект был мигрирован с Firebase на Яндекс.Облако для решения проблем с доступностью в России. Яндекс.Облако предоставляет аналогичные сервисы, которые работают без VPN.

## 📋 Что нужно настроить

### 1. **Яндекс.Облако аккаунт**
- Зарегистрируйтесь на [cloud.yandex.ru](https://cloud.yandex.ru)
- Создайте новый проект
- Настройте платежный аккаунт (есть бесплатный тариф)

### 2. **Сервисы для настройки**

#### **A. Yandex Cloud Functions (замена Firebase Functions)**
- Создайте функцию для обработки API запросов
- Настройте HTTP триггер
- Разверните backend логику

#### **B. Yandex Managed Service for PostgreSQL (замена Firestore)**
- Создайте кластер PostgreSQL
- Настройте базу данных для хранения:
  - Пользователей (users)
  - Заявок на доступ (pending_users)
  - Данных календаря (months)

#### **C. Yandex Object Storage (замена Firebase Storage)**
- Создайте bucket для статических файлов
- Настройте CORS для веб-приложения

## 🔧 Пошаговая настройка

### Шаг 1: Создание Cloud Function

```bash
# Установка Yandex Cloud CLI
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash

# Инициализация
yc init

# Создание функции
yc serverless function create --name calendar-api
```

### Шаг 2: Структура базы данных

```sql
-- Таблица пользователей
CREATE TABLE users (
    telegram_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'guest',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица заявок на доступ
CREATE TABLE pending_users (
    telegram_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица данных календаря
CREATE TABLE months (
    id VARCHAR(20) PRIMARY KEY, -- формат: "2024_0" (год_месяц)
    duties JSONB,
    tech_duties JSONB,
    general_schedule JSONB,
    colors JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(active);
CREATE INDEX idx_months_id ON months(id);
```

### Шаг 3: Backend API (Node.js)

Создайте файл `function/index.js`:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

// Middleware для проверки API ключа
const checkApiKey = (req, res, next) => {
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    if (apiKey !== process.env.API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Получение пользователя
app.get('/users/:telegramId', checkApiKey, async (req, res) => {
    try {
        const { telegramId } = req.params;
        const result = await pool.query(
            'SELECT * FROM users WHERE telegram_id = $1 AND active = true',
            [telegramId]
        );
        
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получение всех пользователей
app.get('/users', checkApiKey, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE active = true');
        const users = {};
        result.rows.forEach(row => {
            users[row.telegram_id] = row;
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Создание/обновление пользователя
app.post('/users', checkApiKey, async (req, res) => {
    try {
        const { telegramId, name, role, active } = req.body;
        const result = await pool.query(
            `INSERT INTO users (telegram_id, name, role, active) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (telegram_id) 
             DO UPDATE SET name = $2, role = $3, active = $4, updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [telegramId, name, role, active]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получение данных месяца
app.get('/months/:monthId', checkApiKey, async (req, res) => {
    try {
        const { monthId } = req.params;
        const result = await pool.query(
            'SELECT * FROM months WHERE id = $1',
            [monthId]
        );
        
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Month data not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Сохранение данных месяца
app.put('/months/:monthId', checkApiKey, async (req, res) => {
    try {
        const { monthId } = req.params;
        const { duties, techDuties, generalSchedule, colors } = req.body;
        
        const result = await pool.query(
            `INSERT INTO months (id, duties, tech_duties, general_schedule, colors) 
             VALUES ($1, $2, $3, $4, $5) 
             ON CONFLICT (id) 
             DO UPDATE SET 
                duties = $2, 
                tech_duties = $3, 
                general_schedule = $4, 
                colors = $5, 
                updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [monthId, duties, techDuties, generalSchedule, colors]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Заявки на доступ
app.get('/pending-users', checkApiKey, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM pending_users ORDER BY requested_at DESC');
        const pendingUsers = {};
        result.rows.forEach(row => {
            pendingUsers[row.telegram_id] = row;
        });
        res.json(pendingUsers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/pending-users', checkApiKey, async (req, res) => {
    try {
        const { telegramId, name, username } = req.body;
        const result = await pool.query(
            'INSERT INTO pending_users (telegram_id, name, username) VALUES ($1, $2, $3) RETURNING *',
            [telegramId, name, username]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports.handler = app;
```

### Шаг 4: Обновление конфигурации

Обновите `yandex-cloud-config.json`:

```json
{
  "yandexCloud": {
    "endpoint": "https://functions.yandexcloud.net/YOUR_FUNCTION_ID",
    "apiKey": "YOUR_API_KEY",
    "database": {
      "host": "YOUR_DB_HOST",
      "port": 5432,
      "database": "YOUR_DB_NAME",
      "user": "YOUR_DB_USER",
      "password": "YOUR_DB_PASSWORD"
    }
  }
}
```

### Шаг 5: Развертывание

```bash
# Создание версии функции
yc serverless function version create \
  --function-name calendar-api \
  --runtime nodejs16 \
  --entrypoint index.handler \
  --memory 128m \
  --execution-timeout 30s \
  --source-path ./function

# Создание HTTP триггера
yc serverless trigger create http \
  --name calendar-api-trigger \
  --function-name calendar-api \
  --function-tag latest
```

## 🔐 Безопасность

### API ключи
- Используйте сильные API ключи
- Храните ключи в переменных окружения
- Регулярно ротируйте ключи

### База данных
- Настройте SSL соединения
- Используйте отдельного пользователя для приложения
- Ограничьте доступ по IP

### CORS
Настройте CORS для вашего домена в Cloud Function.

## 💰 Стоимость

### Бесплатный тариф Яндекс.Облака:
- **Cloud Functions**: 1,000,000 вызовов в месяц
- **Managed PostgreSQL**: 2 ГБ хранилища
- **Object Storage**: 10 ГБ хранилища

### Платный тариф (если превышен лимит):
- Cloud Functions: ~0.5₽ за 1000 вызовов
- PostgreSQL: ~0.5₽ за ГБ в месяц
- Object Storage: ~0.5₽ за ГБ в месяц

## 🚀 Преимущества Яндекс.Облака

1. **Работает в России без VPN**
2. **Соответствие 152-ФЗ**
3. **Российские дата-центры**
4. **Техническая поддержка на русском**
5. **Интеграция с другими сервисами Яндекса**

## 🔄 Миграция данных

Если у вас есть данные в Firebase, создайте скрипт миграции:

```javascript
// migrate-from-firebase.js
const admin = require('firebase-admin');
const { Pool } = require('pg');

// Инициализация Firebase Admin
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'your-firebase-project'
});

const db = admin.firestore();
const pool = new Pool(/* ваши настройки PostgreSQL */);

async function migrateUsers() {
    const usersSnapshot = await db.collection('users').get();
    
    for (const doc of usersSnapshot.docs) {
        const userData = doc.data();
        await pool.query(
            'INSERT INTO users (telegram_id, name, role, active) VALUES ($1, $2, $3, $4)',
            [doc.id, userData.name, userData.role, userData.active]
        );
    }
}

async function migrateMonths() {
    const monthsSnapshot = await db.collection('months').get();
    
    for (const doc of monthsSnapshot.docs) {
        const monthData = doc.data();
        await pool.query(
            'INSERT INTO months (id, duties, tech_duties, general_schedule, colors) VALUES ($1, $2, $3, $4, $5)',
            [doc.id, monthData.duties, monthData.techDuties, monthData.generalSchedule, monthData.colors]
        );
    }
}

// Запуск миграции
migrateUsers().then(() => migrateMonths()).then(() => {
    console.log('Миграция завершена');
    process.exit(0);
});
```

## 📞 Поддержка

- [Документация Яндекс.Облака](https://cloud.yandex.ru/docs/)
- [Техническая поддержка](https://cloud.yandex.ru/support)
- [Сообщество разработчиков](https://t.me/yandexcloud) 