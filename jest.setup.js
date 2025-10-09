// Note: avoid importing '@testing-library/jest-native/extend-expect' here
// because it brings in react-native internals that complicate our isolated tests.
// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => require('./__mocks__/@react-native-async-storage__mock'));
// Mock expo-router hooks used in the project
jest.mock('expo-router', () => ({
	useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
	useSegments: () => [],
	Link: ({ children }) => children,
}));
// Mock native expo modules
jest.mock('expo-camera', () => ({ Camera: jest.fn() }));
jest.mock('expo-image-picker', () => ({ launchCameraAsync: jest.fn(), launchImageLibraryAsync: jest.fn() }));
