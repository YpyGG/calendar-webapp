const request = require('supertest');
const { app } = require('./index');

// Тест health check
describe('Health Check', () => {
    test('GET /health should return 200 and healthy status', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
        expect(response.body.database).toBe('connected');
    });
});

// Тест аутентификации
describe('Authentication', () => {
    test('GET /users without API key should return 401', async () => {
        const response = await request(app).get('/users');
        expect(response.status).toBe(401);
    });
    
    test('GET /users with invalid API key should return 401', async () => {
        const response = await request(app)
            .get('/users')
            .set('Authorization', 'Bearer invalid-key');
        expect(response.status).toBe(401);
    });
});

// Тест валидации
describe('Validation', () => {
    test('POST /users with invalid data should return 400', async () => {
        const response = await request(app)
            .post('/users')
            .set('Authorization', 'Bearer test-key')
            .send({
                telegramId: 'invalid',
                name: '',
                role: 'invalid-role'
            });
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Validation error');
    });
});

// Тест rate limiting
describe('Rate Limiting', () => {
    test('Should limit requests after threshold', async () => {
        // Делаем много запросов подряд
        const promises = [];
        for (let i = 0; i < 105; i++) {
            promises.push(request(app).get('/health'));
        }
        
        const responses = await Promise.all(promises);
        const tooManyRequests = responses.filter(r => r.status === 429);
        
        expect(tooManyRequests.length).toBeGreaterThan(0);
    });
});

console.log('Тесты готовы к запуску. Используйте: npm test'); 