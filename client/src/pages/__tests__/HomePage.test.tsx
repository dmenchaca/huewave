import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomePage from '../HomePage';
import { useUser } from '../../hooks/use-user';
import { useColorPalette } from '../../hooks/use-color-palette';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import test setup
import '../test/setup';

// Mocks
vi.mock('../../hooks/use-user');
vi.mock('../../hooks/use-color-palette');
vi.mock('../../hooks/use-toast');

// Create a custom render function that includes providers
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Reset mocks before each test
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe('HomePage Color Regeneration', () => {
  const mockGenerateNewPalette = vi.fn();
  
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Mock useUser hook
    (useUser as any).mockReturnValue({
      user: null,
      isLoading: false,
      isFetching: false,
    });
    
    // Mock useColorPalette hook with default values
    (useColorPalette as any).mockReturnValue({
      colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'],
      lockedColors: [false, false, false, false, false],
      darkMode: false,
      generateNewPalette: mockGenerateNewPalette,
      toggleLock: vi.fn(),
      toggleDarkMode: vi.fn(),
      handleColorChange: vi.fn(),
    });
  });

  it('should regenerate colors when spacebar is pressed', () => {
    renderWithProviders(<HomePage />);
    
    // Simulate spacebar press on document
    fireEvent.keyDown(window.document, { code: 'Space' });
    
    // Check if generateNewPalette was called
    expect(mockGenerateNewPalette).toHaveBeenCalledTimes(1);
  });

  it('should not regenerate colors when other keys are pressed', () => {
    renderWithProviders(<HomePage />);
    
    // Simulate various other key presses
    fireEvent.keyDown(window.document, { code: 'Enter' });
    fireEvent.keyDown(window.document, { code: 'KeyA' });
    fireEvent.keyDown(window.document, { code: 'ArrowUp' });
    
    // Check that generateNewPalette was not called
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();
  });

  it('should not regenerate colors when spacebar is pressed on input elements', () => {
    renderWithProviders(<HomePage />);
    
    // Create a text input and add it to the document
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    
    // Simulate spacebar press on input
    fireEvent.keyDown(input, { code: 'Space' });
    
    // Check that generateNewPalette was not called
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();
    
    // Cleanup
    document.body.removeChild(input);
  });

  it('should not regenerate colors when a modal dialog is open', () => {
    // Mock useColorPalette with isDialogOpen set to true
    (useColorPalette as any).mockReturnValue({
      colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'],
      lockedColors: [false, false, false, false, false],
      darkMode: false,
      generateNewPalette: mockGenerateNewPalette,
      toggleLock: vi.fn(),
      toggleDarkMode: vi.fn(),
      handleColorChange: vi.fn(),
      isDialogOpen: true,
    });

    renderWithProviders(<HomePage />);
    
    // Simulate spacebar press
    fireEvent.keyDown(window.document, { code: 'Space' });
    
    // Check that generateNewPalette was not called
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();
  });

  it('should not regenerate colors on repeated spacebar press (held down)', () => {
    renderWithProviders(<HomePage />);
    
    // Simulate spacebar being held down (repeat = true)
    fireEvent.keyDown(window.document, { code: 'Space', repeat: true });
    
    // Check that generateNewPalette was not called
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();
  });
});
