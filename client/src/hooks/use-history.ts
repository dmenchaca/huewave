
import { useState, useCallback } from 'react';

export function useHistory<T>(initialState: T) {
  const [undoStack, setUndoStack] = useState<T[]>([]);
  const [redoStack, setRedoStack] = useState<T[]>([]);

  const pushToHistory = useCallback((state: T) => {
    setUndoStack(prev => [...prev, state]);
    setRedoStack([]); // Clear redo stack on new changes
  }, []);

  const undo = useCallback((current: T): T | null => {
    if (undoStack.length === 0) return null;
    
    const newUndoStack = [...undoStack];
    const previousState = newUndoStack.pop();
    
    setUndoStack(newUndoStack);
    setRedoStack(prev => [...prev, current]);
    
    return previousState || null;
  }, [undoStack]);

  const redo = useCallback((current: T): T | null => {
    if (redoStack.length === 0) return null;
    
    const newRedoStack = [...redoStack];
    const nextState = newRedoStack.pop();
    
    setRedoStack(newRedoStack);
    setUndoStack(prev => [...prev, current]);
    
    return nextState || null;
  }, [redoStack]);

  return {
    undoStack,
    redoStack,
    pushToHistory,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0
  };
}
