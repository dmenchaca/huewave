import { useState, useCallback, useEffect, useRef } from 'react';
import { Color } from '../types';
import { isMacOS } from '../utils/platform';

export const useUndoRedo = (
  colors: Color[],
  setColors: (colors: Color[]) => void
) => {
  const [undoStack, setUndoStack] = useState<Color[][]>([]);
  const [redoStack, setRedoStack] = useState<Color[][]>([]);

  const pushToHistory = useCallback((newColors: Color[]) => {
    setUndoStack(prev => [...prev, structuredClone(colors)]);
    setRedoStack([]); // Clear redo stack on new changes
  }, [colors]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    
    const previousState = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);
    
    setUndoStack(newUndoStack);
    setRedoStack(prev => [...prev, structuredClone(colors)]);
    
    setColors(colors.map((color, index) =>
      color.locked ? color : { ...previousState[index] }
    ));
  }, [undoStack, colors, setColors]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    
    const nextState = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);
    
    setRedoStack(newRedoStack);
    setUndoStack(prev => [...prev, structuredClone(colors)]);
    
    setColors(colors.map((color, index) =>
      color.locked ? color : { ...nextState[index] }
    ));
  }, [redoStack, colors, setColors]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      const mac = isMacOS();
      
      // Undo: Cmd+Z (Mac) or Ctrl+Z (Windows)
      if ((mac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo: Cmd+Shift+Z (Mac) or Ctrl+Y (Windows)
      else if (
        (mac && e.metaKey && e.shiftKey && e.key.toLowerCase() === 'z') ||
        (!mac && e.ctrlKey && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    pushToHistory,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0
  };
};