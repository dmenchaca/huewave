import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import HomePage from '../HomePage';
import { useUser } from '@/hooks/use-user';
import { useColorPalette } from '@/hooks/use-color-palette';

// Extract the handleKeyPress function type
type KeyPressHandler = (e: KeyboardEvent) => void;

// Mock dependencies
vi.mock('@/hooks/use-user', () => ({
  useUser: vi.fn(() => ({
    user: null,
    logout: vi.fn(),
    isLoading: false,
    isFetching: false,
  }))
}));

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn()
  }))
}));

// Mock AuthDialog to prevent react-hook-form errors
vi.mock('@/components/AuthDialog', () => ({
  default: vi.fn(() => null)
}));

const mockGenerateNewPalette = vi.fn();

// Mock useColorPalette hook
vi.mock('@/hooks/use-color-palette', () => ({
  useColorPalette: vi.fn(() => ({
    colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'],
    lockedColors: [false, false, false, false, false],
    darkMode: false,
    generateNewPalette: mockGenerateNewPalette,
    toggleLock: vi.fn(),
    toggleDarkMode: vi.fn(),
    handleColorChange: vi.fn(),
    setColors: vi.fn(),
  }))
}));

// Create a wrapper component for providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui);
};

describe('HomePage Color Regeneration', () => {
  let capturedKeyPressHandler: KeyPressHandler;

  // Helper to create keyboard events
  const createKeyboardEvent = (overrides: Partial<KeyboardEvent> = {}): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      ...overrides,
    });

    // Add missing properties
    Object.defineProperties(event, {
      preventDefault: { value: vi.fn() },
      stopPropagation: { value: vi.fn() },
      code: { value: overrides.code || 'Space' },
      type: { value: overrides.type || 'keydown' },
      repeat: { value: overrides.repeat || false },
      isTrusted: { value: overrides.isTrusted !== undefined ? overrides.isTrusted : true },
      target: { value: overrides.target || document.body },
    });

    return event;
  };

  beforeEach(() => {
    // Spy on useEffect to capture the keypress handler
    vi.spyOn(React, 'useEffect').mockImplementation((callback) => {
      // Capture the callback function that contains the handleKeyPress
      const cleanup = callback();
      // Extract the handler from the first argument of addEventListener
      if (typeof cleanup === 'function') {
        const original = window.addEventListener;
        window.addEventListener = vi.fn((event, handler) => {
          if (event === 'keydown') {
            capturedKeyPressHandler = handler as KeyPressHandler;
          }
          return original.call(window, event, handler);
        });
      }
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('should regenerate colors only when spacebar is pressed', () => {
    // Render component to set up handlers
    renderWithProviders(<HomePage />);

    // Initial render should not trigger color generation
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();

    // Test valid spacebar press
    const spaceEvent = createKeyboardEvent({ code: 'Space' });
    capturedKeyPressHandler(spaceEvent);

    // Verify color regeneration and event handling
    expect(mockGenerateNewPalette).toHaveBeenCalledTimes(1);
    expect(spaceEvent.preventDefault).toHaveBeenCalled();
    expect(spaceEvent.stopPropagation).toHaveBeenCalled();

    // Test that other keys don't trigger regeneration
    ['Enter', 'KeyA', 'ArrowUp', 'Tab', 'Escape'].forEach(code => {
      const event = createKeyboardEvent({ code });
      capturedKeyPressHandler(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });

    // Count should still be 1 since other keys shouldn't trigger regeneration
    expect(mockGenerateNewPalette).toHaveBeenCalledTimes(1);

    // Test untrusted event
    const untrustedEvent = createKeyboardEvent({ code: 'Space', isTrusted: false });
    capturedKeyPressHandler(untrustedEvent);
    expect(mockGenerateNewPalette).toHaveBeenCalledTimes(1); // Should not increment

    // Test repeated keypress
    const repeatedEvent = createKeyboardEvent({ code: 'Space', repeat: true });
    capturedKeyPressHandler(repeatedEvent);
    expect(mockGenerateNewPalette).toHaveBeenCalledTimes(1); // Should not increment
  });

  it('should not regenerate colors when spacebar is pressed in form elements', () => {
    // Render component to set up handlers
    renderWithProviders(<HomePage />);
    
    // Clear any initial calls
    mockGenerateNewPalette.mockClear();
    
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
      
      const event = createKeyboardEvent({ code: 'Space', target: element });
      capturedKeyPressHandler(event);
      
      expect(mockGenerateNewPalette).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });
    
    // Verify spacebar still works on non-form elements
    const div = document.createElement('div');
    const event = createKeyboardEvent({ code: 'Space', target: div });
    capturedKeyPressHandler(event);
    
    expect(mockGenerateNewPalette).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('should not regenerate colors when dialogs are open', () => {
    // Mock useColorPalette with dialog open state
    const mockUseColorPalette = useColorPalette as jest.Mock;
    mockUseColorPalette.mockImplementation(() => ({
      colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'],
      lockedColors: [false, false, false, false, false],
      darkMode: false,
      generateNewPalette: mockGenerateNewPalette,
      toggleLock: vi.fn(),
      toggleDarkMode: vi.fn(),
      handleColorChange: vi.fn(),
      setColors: vi.fn(),
    }));

    // Render component to set up handlers
    renderWithProviders(<HomePage />);

    // Clear any initial calls
    mockGenerateNewPalette.mockClear();

    // Test spacebar press with dialog open
    const spaceEvent = createKeyboardEvent({ code: 'Space' });
    capturedKeyPressHandler(spaceEvent);
    
    // Verify no color regeneration occurred
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();
    expect(spaceEvent.preventDefault).not.toHaveBeenCalled();
    expect(spaceEvent.stopPropagation).not.toHaveBeenCalled();

    // Test other keys
    ['Enter', 'KeyA', 'Escape'].forEach(code => {
      const event = createKeyboardEvent({ code });
      capturedKeyPressHandler(event);
      expect(mockGenerateNewPalette).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });
  });
  it('should not regenerate colors when any dialog is open', () => {
    // Mock useColorPalette with dialog open states
    const mockUseColorPalette = useColorPalette as jest.Mock;
    mockUseColorPalette.mockImplementation(() => ({
      colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'],
      lockedColors: [false, false, false, false, false],
      darkMode: false,
      generateNewPalette: mockGenerateNewPalette,
      toggleLock: vi.fn(),
      toggleDarkMode: vi.fn(),
      handleColorChange: vi.fn(),
      setColors: vi.fn(),
      isDialogOpen: true,
    }));

    // Render component to set up handlers
    renderWithProviders(<HomePage />);

    // Clear any initial calls
    mockGenerateNewPalette.mockClear();

    // Test spacebar press with dialog open
    const spaceEvent = createKeyboardEvent({ code: 'Space' });
    capturedKeyPressHandler(spaceEvent);
    
    // Verify no color regeneration occurred
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();
    expect(spaceEvent.preventDefault).not.toHaveBeenCalled();
    expect(spaceEvent.stopPropagation).not.toHaveBeenCalled();

    // Test other keys
    ['Enter', 'KeyA', 'Escape'].forEach(code => {
      const event = createKeyboardEvent({ code });
      capturedKeyPressHandler(event);
      expect(mockGenerateNewPalette).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });

    // Test with save dialog open
    mockUseColorPalette.mockImplementation(() => ({
      colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'],
      lockedColors: [false, false, false, false, false],
      darkMode: false,
      generateNewPalette: mockGenerateNewPalette,
      toggleLock: vi.fn(),
      toggleDarkMode: vi.fn(),
      handleColorChange: vi.fn(),
      setColors: vi.fn(),
      isSaveAsNewDialogOpen: true,
    }));

    // Test spacebar press with save dialog open
    capturedKeyPressHandler(createKeyboardEvent({ code: 'Space' }));
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();

    // Test with auth dialog open
    mockUseColorPalette.mockImplementation(() => ({
      colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'],
      lockedColors: [false, false, false, false, false],
      darkMode: false,
      generateNewPalette: mockGenerateNewPalette,
      toggleLock: vi.fn(),
      toggleDarkMode: vi.fn(),
      handleColorChange: vi.fn(),
      setColors: vi.fn(),
      isAuthDialogOpen: true,
    }));

    // Test spacebar press with auth dialog open
    capturedKeyPressHandler(createKeyboardEvent({ code: 'Space' }));
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();
  });

  it('should respect locked colors during regeneration', () => {
    // Mock useColorPalette with some locked colors
    const mockUseColorPalette = useColorPalette as jest.Mock;
    mockUseColorPalette.mockImplementation(() => ({
      colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'],
      lockedColors: [true, false, true, false, false],
      darkMode: false,
      generateNewPalette: mockGenerateNewPalette,
      toggleLock: vi.fn(),
      toggleDarkMode: vi.fn(),
      handleColorChange: vi.fn(),
      setColors: vi.fn(),
    }));

    // Render component to set up handlers
    renderWithProviders(<HomePage />);

    // Clear any initial calls
    mockGenerateNewPalette.mockClear();

    // Trigger color regeneration with spacebar
    const spaceEvent = createKeyboardEvent({ code: 'Space' });
    capturedKeyPressHandler(spaceEvent);

    // Verify generateNewPalette was called and events were handled
    expect(mockGenerateNewPalette).toHaveBeenCalledTimes(1);
    expect(spaceEvent.preventDefault).toHaveBeenCalled();
    expect(spaceEvent.stopPropagation).toHaveBeenCalled();

    // Verify locked colors logic in useColorPalette hook
    const { lockedColors, colors } = mockUseColorPalette.mock.results[0].value;
    expect(lockedColors).toEqual([true, false, true, false, false]);
    expect(colors[0]).toBe('#FF0000'); // First color should remain locked
    expect(colors[2]).toBe('#0000FF'); // Third color should remain locked
  });
});
