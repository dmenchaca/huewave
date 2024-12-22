import { useEffect, useCallback, useRef } from 'react';
import { useDialogState } from './useDialogState';

interface KeyboardShortcutOptions {
  key: string;
  callback: () => void;
  allowedElements?: string[];
  preventDefault?: boolean;
  stopPropagation?: boolean;
  useCapture?: boolean;
  disabled?: boolean;
}

export const useKeyboardShortcut = ({
  key,
  callback,
  allowedElements = [],
  preventDefault = true,
  stopPropagation = true,
  useCapture = true,
  disabled = false,
}: KeyboardShortcutOptions) => {
  const { isAnyDialogOpen } = useDialogState();
  const handlerRef = useRef<(e: KeyboardEvent) => void>();

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    // Always prevent spacebar from triggering when dialogs are open
    if (isAnyDialogOpen && e.code === 'Space') {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Don't execute the callback if disabled or dialog is open
    if (disabled || isAnyDialogOpen) return;

    // Early return if not the target key
    if (e.code !== key) return;

    // Check if the event target is an allowed element
    const target = e.target as HTMLElement;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target.isContentEditable ||
      target.closest('[role="dialog"]') || // Check if target is inside a dialog
      (allowedElements.length > 0 && !allowedElements.includes(target.tagName.toLowerCase()))
    ) {
      return;
    }

    if (preventDefault) {
      e.preventDefault();
    }

    if (stopPropagation) {
      e.stopPropagation();
    }

    callback();
  }, [key, callback, isAnyDialogOpen, allowedElements, preventDefault, stopPropagation, disabled]);

  useEffect(() => {
    // Store the handler in a ref to ensure we remove the correct listener
    handlerRef.current = handleKeyPress;
    
    const handler = (e: KeyboardEvent) => handlerRef.current?.(e);
    window.addEventListener('keydown', handler, { capture: useCapture });
    return () => window.removeEventListener('keydown', handler, { capture: useCapture });
  }, [handleKeyPress, useCapture]);
};