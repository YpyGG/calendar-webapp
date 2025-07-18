-- Создание базы данных для календаря дежурств
-- Выполните этот скрипт в вашей PostgreSQL базе данных

-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    telegram_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'guest' CHECK (role IN ('admin', 'boss', 'worker', 'guest')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы заявок на доступ
CREATE TABLE IF NOT EXISTS pending_users (
    telegram_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы данных календаря
CREATE TABLE IF NOT EXISTS months (
    id VARCHAR(20) PRIMARY KEY, -- формат: "2024_0" (год_месяц)
    duties JSONB DEFAULT '{}',
    tech_duties JSONB DEFAULT '{}',
    general_schedule JSONB DEFAULT '{}',
    colors JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_months_id ON months(id);
CREATE INDEX IF NOT EXISTS idx_pending_users_requested_at ON pending_users(requested_at);

-- Создание триггера для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Применение триггера к таблицам
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_months_updated_at ON months;
CREATE TRIGGER update_months_updated_at 
    BEFORE UPDATE ON months 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Вставка начальных данных (администратор)
INSERT INTO users (telegram_id, name, role, active) 
VALUES ('670669284', 'Администратор', 'admin', true)
ON CONFLICT (telegram_id) DO UPDATE SET 
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    active = EXCLUDED.active;

-- Создание представления для статистики
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    role,
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE active = true) as active_users
FROM users 
GROUP BY role;

-- Создание представления для последних изменений
CREATE OR REPLACE VIEW recent_changes AS
SELECT 
    'user' as table_name,
    telegram_id as record_id,
    name,
    updated_at
FROM users 
WHERE updated_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
UNION ALL
SELECT 
    'month' as table_name,
    id as record_id,
    'Calendar data' as name,
    updated_at
FROM months 
WHERE updated_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY updated_at DESC;

-- Комментарии к таблицам
COMMENT ON TABLE users IS 'Пользователи системы с ролями и правами доступа';
COMMENT ON TABLE pending_users IS 'Заявки на получение доступа к системе';
COMMENT ON TABLE months IS 'Данные календаря дежурств по месяцам';
COMMENT ON COLUMN users.telegram_id IS 'Telegram ID пользователя (первичный ключ)';
COMMENT ON COLUMN users.role IS 'Роль пользователя: admin, boss, worker, guest';
COMMENT ON COLUMN months.id IS 'Идентификатор месяца в формате YYYY_M (год_месяц)';
COMMENT ON COLUMN months.duties IS 'JSON данные дежурств';
COMMENT ON COLUMN months.tech_duties IS 'JSON данные технических дежурств';
COMMENT ON COLUMN months.general_schedule IS 'JSON данные общего расписания';
COMMENT ON COLUMN months.colors IS 'JSON данные цветов для календаря'; 