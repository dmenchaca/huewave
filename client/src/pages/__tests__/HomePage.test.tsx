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

  // Set up basic window location properties
  if (typeof window !== 'undefined') {
    window.history.pushState({}, 'Test page', '/');
  }

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
    // Mock environment to prevent initial palette generation
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

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

    // Reset environment
    process.env.NODE_ENV = originalEnv;

    // Clear initial calls to generateNewPalette
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
    // Mock dialog states before rendering
    const useStateSpy = vi.spyOn(React, 'useState');
    
    // Mock useState for dialog states to be open
    useStateSpy.mockImplementationOnce(() => [true, vi.fn()]); // isDialogOpen
    useStateSpy.mockImplementationOnce(() => [true, vi.fn()]); // isSaveAsNewDialogOpen
    useStateSpy.mockImplementationOnce(() => [true, vi.fn()]); // isAuthDialogOpen
    useStateSpy.mockImplementationOnce(() => [null, vi.fn()]); // selectedPalette

    // Update useColorPalette mock to match dialog state
    (useColorPalette as any).mockReturnValue({
      colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'],
      lockedColors: [false, false, false, false, false],
      darkMode: false,
      generateNewPalette: mockGenerateNewPalette,
      toggleLock: vi.fn(),
      toggleDarkMode: vi.fn(),
      handleColorChange: vi.fn(),
      setColors: vi.fn(),
      isDialogOpen: true,
    });

    // Render component
    const { container } = renderWithProviders(<HomePage />);

    // Clear any initial calls
    mockGenerateNewPalette.mockClear();

    // Verify spacebar press does not trigger regeneration when dialogs are open
    fireEvent.keyDown(container, { 
      code: 'Space', 
      type: 'keydown',
      repeat: false,
      isTrusted: true 
    });

    expect(mockGenerateNewPalette).not.toHaveBeenCalled();

    // Verify other keys also don't trigger regeneration
    ['Enter', 'KeyA', 'Escape'].forEach(key => {
      fireEvent.keyDown(container, { 
        code: key, 
        type: 'keydown',
        repeat: false,
        isTrusted: true 
      });
      expect(mockGenerateNewPalette).not.toHaveBeenCalled();
    });

    // Cleanup
    useStateSpy.mockRestore();
  });

  it('should not regenerate colors for untrusted events or repeated keypresses', () => {
    // Mock dialog states to be closed
    const useStateSpy = vi.spyOn(React, 'useState');
    useStateSpy.mockImplementationOnce(() => [false, vi.fn()]); // isDialogOpen
    useStateSpy.mockImplementationOnce(() => [false, vi.fn()]); // isSaveAsNewDialogOpen
    useStateSpy.mockImplementationOnce(() => [false, vi.fn()]); // isAuthDialogOpen
    useStateSpy.mockImplementationOnce(() => [null, vi.fn()]); // selectedPalette

    // Render component
    const { container } = renderWithProviders(<HomePage />);

    // Clear any initial calls
    mockGenerateNewPalette.mockClear();

    // Test untrusted event
    fireEvent.keyDown(container, { 
      code: 'Space', 
      type: 'keydown', 
      repeat: false, 
      isTrusted: false 
    });
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();

    // Test repeated keypress (key held down)
    fireEvent.keyDown(container, { 
      code: 'Space', 
      type: 'keydown', 
      repeat: true, 
      isTrusted: true 
    });
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();

    // Verify rapid succession of repeated keypresses doesn't trigger
    for (let i = 0; i < 5; i++) {
      fireEvent.keyDown(container, { 
        code: 'Space', 
        type: 'keydown', 
        repeat: true, 
        isTrusted: true 
      });
    }
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();

    // Verify a valid spacebar press still works
    fireEvent.keyDown(container, { 
      code: 'Space', 
      type: 'keydown', 
      repeat: false, 
      isTrusted: true 
    });
    expect(mockGenerateNewPalette).toHaveBeenCalledTimes(1);

    // Cleanup
    useStateSpy.mockRestore();
  });
});
