import { useState, useCallback, useEffect, useRef } from 'react';
import { Color } from '../types';
import { generateRandomHex, generateNewColors } from '../utils/colors';
import { usePaletteStore } from '../store/paletteStore';
import { useUndoRedo } from './useUndoRedo';
import { useKeyboardShortcut } from './useKeyboardShortcut';

export const useColorPalette = () => {
  const [colors, setColors] = useState<Color[]>(() => 
    Array(5).fill(null).map(() => ({
      hex: generateRandomHex(),
      locked: false,
    }))
  );

  const { currentPalette } = usePaletteStore();
  const { pushToHistory, undo, redo } = useUndoRedo(colors, setColors);
  const isInitialMount = useRef(true);
  const updateRef = useRef(false);

  // Update colors when current palette changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (currentPalette && !updateRef.current) {
      updateRef.current = true;
      const newColors = currentPalette.colors.map(color => ({
        hex: color.hex,
        locked: color.locked || false
      }));
      setColors(newColors);
      setTimeout(() => {
        updateRef.current = false;
      }, 0);
    }
  }, [currentPalette]);

  const generateNewPalette = useCallback(() => {
    if (updateRef.current) return;
    updateRef.current = true;
    const newColors = generateNewColors(colors);
    setColors(newColors);
    pushToHistory(newColors);
    setTimeout(() => {
      updateRef.current = false;
    }, 0);
  }, [colors, pushToHistory]);

  // Register spacebar shortcut
  useKeyboardShortcut({
    key: 'Space',
    callback: generateNewPalette,
    preventDefault: true,
    stopPropagation: true,
    useCapture: true
  });

  const toggleLock = useCallback((index: number) => {
    if (updateRef.current) return;
    updateRef.current = true;
    setColors(prevColors => {
      const newColors = prevColors.map((color, i) => 
        i === index ? { ...color, locked: !color.locked } : color
      );
      pushToHistory(newColors);
      return newColors;
    });
    setTimeout(() => {
      updateRef.current = false;
    }, 0);
  }, [pushToHistory]);

  const updateColor = useCallback((index: number, hex: string) => {
    if (updateRef.current) return;
    updateRef.current = true;
    setColors(prevColors => {
      const newColors = prevColors.map((color, i) =>
        i === index ? { ...color, hex } : color
      );
      pushToHistory(newColors);
      return newColors;
    });
    setTimeout(() => {
      updateRef.current = false;
    }, 0);
  }, [pushToHistory]);

  return { colors, generateNewPalette, toggleLock, updateColor };
};