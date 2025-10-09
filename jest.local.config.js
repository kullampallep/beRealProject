module.exports = {
  // Minimal config for local frontend tests — doesn't load react-native's jest setup
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/__tests__/**/*.test.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(expo-image|expo-image-picker|@react-native-async-storage)/)'
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '^react-native$': '<rootDir>/__mocks__/react-native.js'
  }
};
