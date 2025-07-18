const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const winston = require('winston');

const app = express();

// Настройка логирования
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' })
    ]
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // максимум 100 запросов с одного IP
    message: { error: 'Too many requests from this IP' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(limiter);
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Подключение к базе данных
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Проверка подключения к БД
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Схемы валидации
const userSchema = Joi.object({
    telegramId: Joi.string().pattern(/^\d+$/).required(),
    name: Joi.string().min(2).max(100).required(),
    role: Joi.string().valid('admin', 'boss', 'worker', 'guest').required(),
    active: Joi.boolean().default(true)
});

const monthSchema = Joi.object({
    duties: Joi.object().default({}),
    techDuties: Joi.object().default({}),
    generalSchedule: Joi.object().default({}),
    colors: Joi.object().default({})
});

const pendingUserSchema = Joi.object({
    telegramId: Joi.string().pattern(/^\d+$/).required(),
    name: Joi.string().min(2).max(100).required(),
    username: Joi.string().max(50).optional()
});

// Middleware для валидации
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation error',
                details: error.details.map(d => d.message)
            });
        }
        next();
    };
};

// Middleware для проверки API ключа
const checkApiKey = (req, res, next) => {
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    if (!apiKey || apiKey !== process.env.API_KEY) {
        logger.warn('Unauthorized access attempt', { ip: req.ip, path: req.path });
        return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'Invalid or missing API key'
        });
    }
    next();
};

// Middleware для логирования
const logRequest = (req, res, next) => {
    logger.info('Request received', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
};

app.use(logRequest);

// Health check
app.get('/health', async (req, res) => {
    try {
        // Проверяем подключение к БД
        await pool.query('SELECT 1');
        res.json({ 
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        });
    } catch (error) {
        logger.error('Health check failed', { error: error.message });
        res.status(503).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// === API ENDPOINTS ===

// Получение пользователя по Telegram ID
app.get('/users/:telegramId', checkApiKey, async (req, res) => {
    try {
        const { telegramId } = req.params;
        
        if (!telegramId || !/^\d+$/.test(telegramId)) {
            return res.status(400).json({ error: 'Invalid telegram ID' });
        }

        const result = await pool.query(
            'SELECT telegram_id, name, role, active, created_at, updated_at FROM users WHERE telegram_id = $1 AND active = true',
            [telegramId]
        );
        
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        logger.error('Error getting user', {
            error: error.message,
            stack: error.stack,
            telegramId: req.params.telegramId
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получение всех пользователей
app.get('/users', checkApiKey, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT telegram_id, name, role, active, created_at, updated_at FROM users WHERE active = true ORDER BY name'
        );
        
        const users = {};
        result.rows.forEach(row => {
            users[row.telegram_id] = row;
        });
        
        res.json(users);
    } catch (error) {
        logger.error('Error getting users', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Создание/обновление пользователя
app.post('/users', checkApiKey, validateRequest(userSchema), async (req, res) => {
    try {
        const { telegramId, name, role, active } = req.body;

        const result = await pool.query(
            `INSERT INTO users (telegram_id, name, role, active) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (telegram_id) 
             DO UPDATE SET name = $2, role = $3, active = $4, updated_at = CURRENT_TIMESTAMP
             RETURNING telegram_id, name, role, active, created_at, updated_at`,
            [telegramId, name, role, active !== false]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating/updating user', {
            error: error.message,
            stack: error.stack,
            telegramId: req.body.telegramId
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Удаление пользователя
app.delete('/users/:telegramId', checkApiKey, async (req, res) => {
    try {
        const { telegramId } = req.params;
        
        const result = await pool.query(
            'DELETE FROM users WHERE telegram_id = $1 RETURNING telegram_id',
            [telegramId]
        );
        
        if (result.rows.length > 0) {
            res.json({ message: 'User deleted successfully' });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        logger.error('Error deleting user', {
            error: error.message,
            stack: error.stack,
            telegramId: req.params.telegramId
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получение данных месяца
app.get('/months/:monthId', checkApiKey, async (req, res) => {
    try {
        const { monthId } = req.params;
        
        if (!monthId || !/^\d{4}_\d{1,2}$/.test(monthId)) {
            return res.status(400).json({ error: 'Invalid month ID format (expected: YYYY_M)' });
        }

        const result = await pool.query(
            'SELECT id, duties, tech_duties, general_schedule, colors, created_at, updated_at FROM months WHERE id = $1',
            [monthId]
        );
        
        if (result.rows.length > 0) {
            const data = result.rows[0];
            res.json({
                id: data.id,
                duties: data.duties || {},
                techDuties: data.tech_duties || {},
                generalSchedule: data.general_schedule || {},
                colors: data.colors || {},
                createdAt: data.created_at,
                updatedAt: data.updated_at
            });
        } else {
            res.status(404).json({ error: 'Month data not found' });
        }
    } catch (error) {
        logger.error('Error getting month data', {
            error: error.message,
            stack: error.stack,
            monthId: req.params.monthId
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Сохранение данных месяца
app.put('/months/:monthId', checkApiKey, validateRequest(monthSchema), async (req, res) => {
    try {
        const { monthId } = req.params;
        const { duties, techDuties, generalSchedule, colors } = req.body;
        
        if (!monthId || !/^\d{4}_\d{1,2}$/.test(monthId)) {
            return res.status(400).json({ error: 'Invalid month ID format (expected: YYYY_M)' });
        }
        
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
             RETURNING id, duties, tech_duties, general_schedule, colors, created_at, updated_at`,
            [monthId, duties || {}, techDuties || {}, generalSchedule || {}, colors || {}]
        );
        
        const data = result.rows[0];
        res.json({
            id: data.id,
            duties: data.duties,
            techDuties: data.tech_duties,
            generalSchedule: data.general_schedule,
            colors: data.colors,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        });
    } catch (error) {
        logger.error('Error saving month data', {
            error: error.message,
            stack: error.stack,
            monthId: req.params.monthId
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получение всех заявок на доступ
app.get('/pending-users', checkApiKey, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT telegram_id, name, username, requested_at FROM pending_users ORDER BY requested_at DESC'
        );
        
        const pendingUsers = {};
        result.rows.forEach(row => {
            pendingUsers[row.telegram_id] = row;
        });
        
        res.json(pendingUsers);
    } catch (error) {
        logger.error('Error getting pending users', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Создание заявки на доступ
app.post('/pending-users', checkApiKey, validateRequest(pendingUserSchema), async (req, res) => {
    try {
        const { telegramId, name, username } = req.body;

        const result = await pool.query(
            'INSERT INTO pending_users (telegram_id, name, username) VALUES ($1, $2, $3) RETURNING *',
            [telegramId, name, username || '']
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            logger.warn('Duplicate pending user request', {
                telegramId: req.body.telegramId
            });
            res.status(409).json({ error: 'Access request already exists' });
        } else {
            logger.error('Error creating pending user', {
                error: error.message,
                stack: error.stack,
                telegramId: req.body.telegramId
            });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Удаление заявки на доступ
app.delete('/pending-users/:telegramId', checkApiKey, async (req, res) => {
    try {
        const { telegramId } = req.params;
        
        const result = await pool.query(
            'DELETE FROM pending_users WHERE telegram_id = $1 RETURNING telegram_id',
            [telegramId]
        );
        
        if (result.rows.length > 0) {
            res.json({ message: 'Access request deleted successfully' });
        } else {
            res.status(404).json({ error: 'Access request not found' });
        }
    } catch (error) {
        logger.error('Error deleting pending user', {
            error: error.message,
            stack: error.stack,
            telegramId: req.params.telegramId
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Обработка ошибок
app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Экспорт для Яндекс.Облака
module.exports.handler = app;

// Экспорт для тестов
module.exports.app = app;

// Для локальной разработки
if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
} 