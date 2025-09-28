import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock IndexedDB
const mockIDB = {
  open: jest.fn(() => Promise.resolve({
    result: {
      createObjectStore: jest.fn(),
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          put: jest.fn(),
          get: jest.fn(() => ({ onsuccess: jest.fn(), onerror: jest.fn() })),
          delete: jest.fn(),
          getAll: jest.fn(() => ({ onsuccess: jest.fn(), onerror: jest.fn() }))
        }))
      }))
    },
    onsuccess: jest.fn(),
    onerror: jest.fn(),
    onupgradeneeded: jest.fn()
  }))
};

Object.defineProperty(window, 'indexedDB', {
  value: mockIDB
});

// Mock crypto.subtle for checksum calculation
Object.defineProperty(window.crypto, 'subtle', {
  value: {
    digest: jest.fn(() => Promise.resolve(new ArrayBuffer(32)))
  }
});

// Silence console.log in tests unless explicitly testing logging
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});