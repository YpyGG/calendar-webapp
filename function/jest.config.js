module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/test.js'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    setupFilesAfterEnv: ['./jest.setup.js']
}; 