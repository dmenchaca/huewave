/// <reference types="vitest" />
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import HomePage from '../HomePage';
import { useUser } from '../../hooks/use-user';
import { useColorPalette } from '../../hooks/use-color-palette';
import { useToast } from '@/hooks/use-toast';
import type { RenderResult } from '@testing-library/react';

// Mock the hooks
vi.mock('../../hooks/use-user', () => ({
  useUser: vi.fn()
}));

vi.mock('../../hooks/use-color-palette', () => ({
  useColorPalette: vi.fn()
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn()
  }))
}));

// Create a custom render function that includes providers
const renderWithProviders = (ui: React.ReactElement): RenderResult => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        gcTime: 0,
        refetchOnWindowFocus: false,
      },
    },
  });

  // Mock window.location for BrowserRouter
  Object.defineProperty(window, 'location', {
    value: {
      pathname: '/',
      search: '',
      hash: '',
      href: 'http://localhost/',
      origin: 'http://localhost',
      protocol: 'http:',
      host: 'localhost',
      hostname: 'localhost',
      port: '',
    },
    writable: true,
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('HomePage Color Regeneration', () => {
  const mockGenerateNewPalette = vi.fn();
  let renderResult: RenderResult;

  beforeEach(() => {
    // Reset all mocks and modules before each test
    vi.resetModules();
    vi.clearAllMocks();

    // Setup basic mocked values
    (useUser as any).mockReturnValue({
      user: null,
      isLoading: false,
      isFetching: false,
    });

    // Mock color palette hook with test-specific values and prevent auto-generation
    (useColorPalette as any).mockReturnValue({
      colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'],
      lockedColors: [false, false, false, false, false],
      darkMode: false,
      generateNewPalette: mockGenerateNewPalette,
      toggleLock: vi.fn(),
      toggleDarkMode: vi.fn(),
      handleColorChange: vi.fn(),
      setColors: vi.fn(),
      isDialogOpen: false,
    });

    // Mock toast hook
    (useToast as any).mockReturnValue({
      toast: vi.fn()
    });

    // Render component with providers
    renderResult = renderWithProviders(<HomePage />);

    // Clear initial calls to generateNewPalette from useEffect
    mockGenerateNewPalette.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('should regenerate colors only when spacebar is pressed', () => {
    // Test spacebar press
    fireEvent.keyDown(document.body, { code: 'Space', type: 'keydown', isTrusted: true });
    expect(mockGenerateNewPalette).toHaveBeenCalledTimes(1);

    // Test other keys don't trigger regeneration
    const otherKeys = ['Enter', 'KeyA', 'ArrowUp', 'Tab', 'Escape'];
    otherKeys.forEach(key => {
      fireEvent.keyDown(document.body, { code: key, type: 'keydown', isTrusted: true });
      // Count should still be 1 from the spacebar press
      expect(mockGenerateNewPalette).toHaveBeenCalledTimes(1);
    });

    // Test spacebar press again
    fireEvent.keyDown(document.body, { code: 'Space', type: 'keydown', isTrusted: true });
    expect(mockGenerateNewPalette).toHaveBeenCalledTimes(2);
  });

  it('should not regenerate colors when spacebar is pressed in input elements', () => {
    // Test input element
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    
    fireEvent.keyDown(input, { code: 'Space', type: 'keydown', isTrusted: true });
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();
    
    document.body.removeChild(input);

    // Test textarea element
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();
    
    fireEvent.keyDown(textarea, { code: 'Space', type: 'keydown', isTrusted: true });
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();
    
    document.body.removeChild(textarea);

    // Test button element
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();
    
    fireEvent.keyDown(button, { code: 'Space', type: 'keydown', isTrusted: true });
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();
    
    document.body.removeChild(button);
  });

  it('should not regenerate colors when dialogs are open', () => {
    // Clean up previous render and reset mocks
    cleanup();
    vi.clearAllMocks();
    mockGenerateNewPalette.mockClear();
    
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    // Track useState calls to manage dialog states
    let stateCallCount = 0;
    vi.spyOn(React, 'useState').mockImplementation(() => {
      stateCallCount++;
      // First three useState calls are for dialog states
      if (stateCallCount <= 3) {
        return [true, vi.fn()] as const;
      }
      // Other useState calls get default false value
      return [false, vi.fn()] as const;
    });

    // Mock hooks
    (useUser as any).mockReturnValue({
      user: null,
      isLoading: false,
      isFetching: false,
    });

    (useColorPalette as any).mockReturnValue({
      colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'],
      lockedColors: [false, false, false, false, false],
      darkMode: false,
      generateNewPalette: mockGenerateNewPalette,
      toggleLock: vi.fn(),
      toggleDarkMode: vi.fn(),
      handleColorChange: vi.fn(),
      setColors: vi.fn(),
    });

    (useToast as any).mockReturnValue({
      toast: vi.fn()
    });

    // Render with dialog states mocked as open
    renderResult = renderWithProviders(<HomePage />);

    // Verify initial state
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();

    // Attempt to trigger color regeneration
    fireEvent.keyDown(document.body, { code: 'Space', type: 'keydown', isTrusted: true });
    
    // Verify color regeneration was prevented
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();
  });

  it('should not regenerate colors on repeated spacebar press or when held down', () => {
    // Test held down spacebar (repeat event)
    fireEvent.keyDown(document.body, { code: 'Space', type: 'keydown', repeat: true, isTrusted: true });
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();

    // Test rapid succession of spacebar presses that are repeats
    for (let i = 0; i < 5; i++) {
      fireEvent.keyDown(document.body, { code: 'Space', type: 'keydown', repeat: true, isTrusted: true });
    }
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();

    // Verify a normal spacebar press still works after repeat events
    fireEvent.keyDown(document.body, { code: 'Space', type: 'keydown', repeat: false, isTrusted: true });
    expect(mockGenerateNewPalette).toHaveBeenCalledTimes(1);
  });
});
