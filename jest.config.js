module.exports = {
  preset: 'jest-expo',
  // avoid loading react-native's default setup which may include TS annotations
  setupFiles: [],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|expo|expo-camera|expo-image-picker|expo-image)/)'
  ],
  testEnvironment: 'jsdom'
};
