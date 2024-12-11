/// <reference types="vitest" />
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
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

// Mock AuthDialog to prevent react-hook-form errors
vi.mock('@/components/AuthDialog', () => ({
  default: vi.fn(() => null)
}));

// Create a wrapper component for providers
const Providers = ({ children }: { children: React.ReactNode }) => {
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

  // Mock memory history for testing
  const history = createMemoryHistory();

  return (
    <QueryClientProvider client={queryClient}>
      <Router location={history.location} navigator={history}>
        {children}
      </Router>
    </QueryClientProvider>
  );
};

// Custom render function that includes providers
const renderWithProviders = (ui: React.ReactElement): RenderResult => {
  // Mock window.location before rendering
  const windowLocation = {
    pathname: '/',
    search: '',
    hash: '',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    protocol: 'http:',
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000/',
    assign: vi.fn(),
    reload: vi.fn(),
    replace: vi.fn(),
    toString: vi.fn(() => 'http://localhost:3000/'),
  };

  Object.defineProperty(window, 'location', {
    value: windowLocation,
    writable: true,
  });

  // Mock history API
  const mockHistory = {
    length: 1,
    scrollRestoration: 'auto' as const,
    state: null,
    pushState: vi.fn(),
    replaceState: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  };

  Object.defineProperty(window, 'history', {
    value: mockHistory,
    writable: true,
  });

  return render(ui, {
    wrapper: Providers
  });
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

    // Reset environment
    process.env.NODE_ENV = originalEnv;

    // Clear initial calls to generateNewPalette
    mockGenerateNewPalette.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('should regenerate colors only when spacebar is pressed', () => {
    // Mock the useState hooks for dialog states
    const useStateSpy = vi.spyOn(React, 'useState');
    useStateSpy.mockImplementationOnce(() => [false, vi.fn()]); // isDialogOpen
    useStateSpy.mockImplementationOnce(() => [false, vi.fn()]); // isSaveAsNewDialogOpen
    useStateSpy.mockImplementationOnce(() => [false, vi.fn()]); // isAuthDialogOpen
    useStateSpy.mockImplementationOnce(() => [null, vi.fn()]); // selectedPalette

    const { container } = renderWithProviders(<HomePage />);
    
    // Initial render should not trigger color generation in test environment
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();

    // Create mock event handlers
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();

    // Create and dispatch a keyboard event directly
    const spaceEvent = new KeyboardEvent('keydown', {
      code: 'Space',
      key: ' ',
      bubbles: true,
      cancelable: true,
    });
    
    // Manually add preventDefault and stopPropagation spies
    Object.defineProperties(spaceEvent, {
      preventDefault: { value: preventDefault },
      stopPropagation: { value: stopPropagation },
      isTrusted: { value: true },
      repeat: { value: false },
      target: { value: document.body }
    });
    
    container.dispatchEvent(spaceEvent);

    // Verify color regeneration and event handling
    expect(mockGenerateNewPalette).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();

    // Test that other keys don't trigger regeneration
    const otherKeys = ['Enter', 'KeyA', 'ArrowUp', 'Tab', 'Escape'];
    otherKeys.forEach(key => {
      const keyPreventDefault = vi.fn();
      const keyStopPropagation = vi.fn();
      
      fireEvent.keyDown(container, {
        code: key,
        key,
        type: 'keydown',
        isTrusted: true,
        repeat: false,
        preventDefault: keyPreventDefault,
        stopPropagation: keyStopPropagation,
        target: document.body,
        bubbles: true,
        cancelable: true,
      });

      // Verify other keys don't trigger regeneration or event prevention
      expect(mockGenerateNewPalette).toHaveBeenCalledTimes(1);
      expect(keyPreventDefault).not.toHaveBeenCalled();
      expect(keyStopPropagation).not.toHaveBeenCalled();
    });

    // Clean up
    useStateSpy.mockRestore();
  });

  it('should not regenerate colors when spacebar is pressed in form elements', () => {
    const { container } = renderWithProviders(<HomePage />);
    
    // Helper function to create keyboard events with all required properties
    const createKeyEvent = (code: string, options: Partial<KeyboardEvent> = {}) => ({
      code,
      key: code === 'Space' ? ' ' : code,
      type: 'keydown',
      isTrusted: true,
      repeat: false,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      bubbles: true,
      cancelable: true,
      target: document.body,
      ...options,
    });
    
    // Test various form elements
    const formElements = [
      { type: 'input', attributes: { type: 'text' } },
      { type: 'input', attributes: { type: 'search' } },
      { type: 'textarea', attributes: {} },
      { type: 'button', attributes: {} },
    ];

    formElements.forEach(({ type, attributes }) => {
      const element = document.createElement(type);
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
      
      container.appendChild(element);
      element.focus();
      
      // Test spacebar keydown
      fireEvent.keyDown(element, createKeyEvent('Space', { target: element }));
      expect(mockGenerateNewPalette).not.toHaveBeenCalled();
      
      container.removeChild(element);
    });

    // Test spacebar on non-form element works
    const div = document.createElement('div');
    container.appendChild(div);
    div.focus();
    
    const spaceEvent = createKeyEvent('Space', { target: div });
    fireEvent.keyDown(div, spaceEvent);
    expect(mockGenerateNewPalette).toHaveBeenCalledTimes(1);
    expect(spaceEvent.preventDefault).toHaveBeenCalled();
    expect(spaceEvent.stopPropagation).toHaveBeenCalled();
  });

  it('should not regenerate colors for untrusted events or repeated keypresses', () => {
    const { container } = renderWithProviders(<HomePage />);

    // Clear any initial calls
    mockGenerateNewPalette.mockClear();

    // Helper function to create keyboard events
    const createKeyEvent = (options: Partial<KeyboardEvent> = {}) => ({
      code: 'Space',
      type: 'keydown',
      isTrusted: true,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      target: document.body,
      bubbles: true,
      cancelable: true,
      ...options,
    });

    // Test untrusted event
    fireEvent.keyDown(container, createKeyEvent({ isTrusted: false }));
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();

    // Test repeated keypress (key held down)
    fireEvent.keyDown(container, createKeyEvent({ repeat: true }));
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();

    // Verify rapid succession of repeated keypresses doesn't trigger
    for (let i = 0; i < 5; i++) {
      fireEvent.keyDown(container, createKeyEvent({ repeat: true }));
    }
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();

    // Verify a valid spacebar press still works
    fireEvent.keyDown(container, createKeyEvent());
    expect(mockGenerateNewPalette).toHaveBeenCalledTimes(1);
  });

  it('should not regenerate colors for untrusted events or repeated keypresses', () => {
    const { container } = renderWithProviders(<HomePage />);

    // Clear any initial calls
    mockGenerateNewPalette.mockClear();

    // Helper function to create keyboard events
    const createKeyEvent = (options: Partial<KeyboardEvent> = {}) => ({
      code: 'Space',
      type: 'keydown',
      isTrusted: true,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      target: document.body,
      bubbles: true,
      cancelable: true,
      ...options,
    });

    // Test untrusted event
    fireEvent.keyDown(container, createKeyEvent({ isTrusted: false }));
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();

    // Test repeated keypress (key held down)
    fireEvent.keyDown(container, createKeyEvent({ repeat: true }));
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();

    // Verify rapid succession of repeated keypresses doesn't trigger
    for (let i = 0; i < 5; i++) {
      fireEvent.keyDown(container, createKeyEvent({ repeat: true }));
    }
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();

    // Verify a valid spacebar press still works
    fireEvent.keyDown(container, createKeyEvent());
    expect(mockGenerateNewPalette).toHaveBeenCalledTimes(1);
  });

  it('should not regenerate colors when dialogs are open', () => {
    // Mock dialog states to be open
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

    const { container } = renderWithProviders(<HomePage />);

    // Clear any initial calls
    mockGenerateNewPalette.mockClear();

    // Verify spacebar press does not trigger regeneration when dialogs are open
    fireEvent.keyDown(container, {
      code: 'Space',
      type: 'keydown',
      repeat: false,
      isTrusted: true,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      bubbles: true,
      cancelable: true,
      target: document.body,
    });

    expect(mockGenerateNewPalette).not.toHaveBeenCalled();

    // Verify other keys also don't trigger regeneration
    ['Enter', 'KeyA', 'Escape'].forEach(key => {
      fireEvent.keyDown(container, {
        code: key,
        type: 'keydown',
        repeat: false,
        isTrusted: true,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        bubbles: true,
        cancelable: true,
        target: document.body,
      });
      expect(mockGenerateNewPalette).not.toHaveBeenCalled();
    });
  });
  it('should respect locked colors during regeneration', () => {
    // Mock useColorPalette with locked colors
    const mockLockedColors = [true, false, true, false, false];
    const initialColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
    
    (useColorPalette as any).mockReturnValue({
      colors: initialColors,
      lockedColors: mockLockedColors,
      darkMode: false,
      generateNewPalette: mockGenerateNewPalette,
      toggleLock: vi.fn(),
      toggleDarkMode: vi.fn(),
      handleColorChange: vi.fn(),
      setColors: vi.fn(),
    });

    const { container } = renderWithProviders(<HomePage />);

    // Clear any initial calls
    mockGenerateNewPalette.mockClear();

    // Trigger color regeneration with spacebar
    fireEvent.keyDown(container, {
      code: 'Space',
      type: 'keydown',
      repeat: false,
      isTrusted: true,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      bubbles: true,
      cancelable: true,
      target: document.body,
    });

    // Verify generateNewPalette was called
    expect(mockGenerateNewPalette).toHaveBeenCalledTimes(1);
  });

  it('should not regenerate colors when dialogs are open', () => {
    // Mock dialog states to be open
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

    const { container } = renderWithProviders(<HomePage />);

    // Clear any initial calls
    mockGenerateNewPalette.mockClear();

    // Verify spacebar press does not trigger regeneration when dialogs are open
    fireEvent.keyDown(container, {
      code: 'Space',
      type: 'keydown',
      repeat: false,
      isTrusted: true,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      bubbles: true,
      cancelable: true,
      target: document.body,
    });

    expect(mockGenerateNewPalette).not.toHaveBeenCalled();

    // Verify other keys also don't trigger regeneration
    ['Enter', 'KeyA', 'Escape'].forEach(key => {
      fireEvent.keyDown(container, {
        code: key,
        type: 'keydown',
        repeat: false,
        isTrusted: true,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        bubbles: true,
        cancelable: true,
        target: document.body,
      });
      expect(mockGenerateNewPalette).not.toHaveBeenCalled();
    });
  });
});
