const storage = new Map();

module.exports = {
  setItem: jest.fn((key, value) => {
    storage.set(key, value);
    return Promise.resolve(true);
  }),
  getItem: jest.fn((key) => Promise.resolve(storage.get(key) ?? null)),
  removeItem: jest.fn((key) => {
    storage.delete(key);
    return Promise.resolve(true);
  }),
  clear: jest.fn(() => {
    storage.clear();
    return Promise.resolve(true);
  }),
};
