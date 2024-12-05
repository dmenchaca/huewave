import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import EditPaletteDialog from '../components/EditPaletteDialog';

describe('EditPaletteDialog', () => {
  const mockPalette = {
    id: 1,
    name: 'Test Palette',
    colors: ['#000000', '#111111', '#222222', '#333333', '#444444']
  };

  beforeEach(() => {
    // Reset any mocks or state before each test
  });

  afterEach(() => {
    // Clean up after each test
    vi.clearAllMocks();
  });

  it('should handle spacebar only when dialog is open', () => {
    const mockGenerateNewPalette = vi.fn();
    const { rerender } = render(
      <EditPaletteDialog
        palette={mockPalette}
        isOpen={false}
        onOpenChange={() => {}}
      />
    );

    fireEvent.keyDown(document, { code: 'Space' });
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();

    rerender(
      <EditPaletteDialog
        palette={mockPalette}
        isOpen={true}
        onOpenChange={() => {}}
      />
    );

    fireEvent.keyDown(document, { code: 'Space' });
    expect(mockGenerateNewPalette).toHaveBeenCalledTimes(1);
  });

  it('should prevent spacebar event propagation when dialog is open', () => {
    const mockPreventDefault = vi.fn();
    const mockStopPropagation = vi.fn();

    render(
      <EditPaletteDialog
        palette={mockPalette}
        isOpen={true}
        onOpenChange={() => {}}
      />
    );

    fireEvent.keyDown(document, {
      code: 'Space',
      preventDefault: mockPreventDefault,
      stopPropagation: mockStopPropagation
    });

    expect(mockPreventDefault).toHaveBeenCalled();
    expect(mockStopPropagation).toHaveBeenCalled();
  });

  it('should not update colors when input field is focused', () => {
    const mockGenerateNewPalette = vi.fn();
    
    render(
      <EditPaletteDialog
        palette={mockPalette}
        isOpen={true}
        onOpenChange={() => {}}
      />
    );

    const input = screen.getByPlaceholderText('Palette name');
    fireEvent.focus(input);
    
    fireEvent.keyDown(input, { 
      code: 'Space',
      preventDefault: () => {},
      stopPropagation: () => {}
    });

    expect(mockGenerateNewPalette).not.toHaveBeenCalled();
  });
});
