import '@testing-library/jest-dom'
import { expect, afterEach, beforeAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extends Vitest's expect method with methods from react-testing-library
expect.extend(matchers)

// Configure jsdom environment
beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock window.resizeTo
  Object.defineProperty(window, 'resizeTo', {
    writable: true,
    value: vi.fn(),
  })

  // Mock navigator.clipboard
  Object.defineProperty(window.navigator, 'clipboard', {
    writable: true,
    value: {
      writeText: vi.fn(),
    },
  })

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    clear: vi.fn()
  }
  Object.defineProperty(window, 'localStorage', {
    writable: true,
    value: localStorageMock
  })
})

// Cleanup after each test case
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  localStorage.clear()
  document.body.innerHTML = ''
})
