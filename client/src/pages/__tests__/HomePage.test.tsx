/// <reference types="vitest" />
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import HomePage from '../HomePage';
import { useUser } from '../../hooks/use-user';
import { useColorPalette } from '../../hooks/use-color-palette';
import { useToast } from '@/hooks/use-toast';

// Mock the hooks
vi.mock('../../hooks/use-user');
vi.mock('../../hooks/use-color-palette');
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn()
  }))
}));

// Create a custom render function that includes providers
const renderWithProviders = (ui: React.ReactElement) => {
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
};

describe('HomePage Color Regeneration', () => {
  const mockGenerateNewPalette = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

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
      isDialogOpen: false,
    });
  });

  it('should regenerate colors when spacebar is pressed', () => {
    renderWithProviders(<HomePage />);
    fireEvent.keyDown(document.body, { code: 'Space' });
    expect(mockGenerateNewPalette).toHaveBeenCalledTimes(1);
  });

  it('should not regenerate colors when other keys are pressed', () => {
    renderWithProviders(<HomePage />);
    fireEvent.keyDown(document.body, { code: 'Enter' });
    fireEvent.keyDown(document.body, { code: 'KeyA' });
    fireEvent.keyDown(document.body, { code: 'ArrowUp' });
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();
  });

  it('should not regenerate colors when spacebar is pressed on input elements', () => {
    renderWithProviders(<HomePage />);
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    fireEvent.keyDown(input, { code: 'Space' });
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('should not regenerate colors when a modal dialog is open', () => {
    // Update mock with dialog open
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
    fireEvent.keyDown(document.body, { code: 'Space' });
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();
  });

  it('should not regenerate colors on repeated spacebar press (held down)', () => {
    renderWithProviders(<HomePage />);
    fireEvent.keyDown(document.body, { code: 'Space', repeat: true });
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();
  });
});
