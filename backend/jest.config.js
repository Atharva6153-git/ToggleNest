module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  // mongodb-memory-server can take longer than Jest's 5s default on a cold
  // start, especially on CI where the mongod binary is downloaded first.
  testTimeout: 30000,
};
