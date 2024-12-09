import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EditPaletteDialog from '../components/EditPaletteDialog';

describe('EditPaletteDialog', () => {
  const mockPalette = {
    id: 1,
    name: 'Test Palette',
    colors: ['#000000', '#111111', '#222222', '#333333', '#444444']
  };

  it('should handle spacebar only when dialog is open', () => {
    const mockGenerateNewPalette = vi.fn();
    const { rerender } = render(
      <EditPaletteDialog
        palette={mockPalette}
        isOpen={false}
        onOpenChange={() => {}}
      />
    );

    // When dialog is closed
    fireEvent.keyDown(document, { code: 'Space' });
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();

    // When dialog is open
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
        palette={{
          id: 1,
          name: 'Test Palette',
          colors: ['#000000', '#111111', '#222222', '#333333', '#444444']
        }}
        isOpen={true}
        onOpenChange={() => {}}
      />
    );

    // Get the input field with the specific classes
    const input = screen.getByPlaceholderText('Palette name');
    
    // Focus the input
    fireEvent.focus(input);
    
    // Simulate spacebar press
    fireEvent.keyDown(input, { 
      code: 'Space',
      preventDefault: () => {},
      stopPropagation: () => {}
    });

    // Verify colors were not updated
    expect(mockGenerateNewPalette).not.toHaveBeenCalled();
  });
});
