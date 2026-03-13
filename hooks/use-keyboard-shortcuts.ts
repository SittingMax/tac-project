/**
 * Keyboard Shortcuts Hook
 * Global keyboard shortcuts for power users
 * Features: Customizable bindings, conflict detection, scope management
 */

import { useEffect, useCallback, useRef } from 'react';

// Types
export interface KeyboardShortcut {
  id: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  scope?: string;
  preventDefault?: boolean;
  enabled?: boolean;
}

export interface ShortcutConfig {
  shortcuts: KeyboardShortcut[];
  scope?: string;
  enabled?: boolean;
}

// Global shortcuts registry
const globalShortcuts = new Map<string, KeyboardShortcut>();

// Format key combination for display
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.meta) parts.push('⌘');

  parts.push(shortcut.key.toUpperCase());

  return parts.join(' + ');
}

// Check if event matches shortcut
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
  const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
  const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
  const altMatch = shortcut.alt ? event.altKey : !event.altKey;
  const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;

  return keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch;
}

// Register global shortcut
export function registerGlobalShortcut(shortcut: KeyboardShortcut): () => void {
  globalShortcuts.set(shortcut.id, shortcut);

  return () => {
    globalShortcuts.delete(shortcut.id);
  };
}

// Hook for component-level shortcuts
export function useKeyboardShortcuts(config: ShortcutConfig): void {
  const { shortcuts, scope, enabled = true } = config;
  const shortcutsRef = useRef(shortcuts);

  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if typing in input fields
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      for (const shortcut of shortcutsRef.current) {
        // Skip if disabled
        if (shortcut.enabled === false) continue;

        // Skip if scope doesn't match
        if (shortcut.scope && shortcut.scope !== scope && scope !== 'global') continue;

        // Skip input-sensitive shortcuts when typing
        if (isInput && !shortcut.ctrl && !shortcut.meta) continue;

        if (matchesShortcut(event, shortcut)) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
          return;
        }
      }
    },
    [enabled, scope]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Hook for single shortcut
export function useKeyboardShortcut(
  key: string,
  action: () => void,
  options: Partial<Omit<KeyboardShortcut, 'id' | 'key' | 'action'>> = {}
): void {
  const { ctrl, shift, alt, meta, description, scope, preventDefault, enabled } = options;

  useKeyboardShortcuts({
    shortcuts: [
      {
        id: `single-${key}`,
        key,
        ctrl,
        shift,
        alt,
        meta,
        action,
        description: description || '',
        scope,
        preventDefault,
        enabled,
      },
    ],
    scope,
    enabled,
  });
}

// Common shortcuts configuration
export const COMMON_SHORTCUTS = {
  // Navigation
  SEARCH: { key: 'k', ctrl: true, description: 'Open search' },
  GO_HOME: { key: 'g', description: 'Go to home' },
  GO_BACK: { key: 'Escape', description: 'Go back / Close modal' },

  // Actions
  SAVE: { key: 's', ctrl: true, description: 'Save' },
  REFRESH: { key: 'r', ctrl: true, description: 'Refresh' },
  NEW: { key: 'n', ctrl: true, description: 'Create new' },
  DELETE: { key: 'Delete', description: 'Delete selected' },

  // Selection
  SELECT_ALL: { key: 'a', ctrl: true, description: 'Select all' },
  DESELECT: { key: 'Escape', description: 'Deselect' },

  // View
  TOGGLE_SIDEBAR: { key: 'b', ctrl: true, description: 'Toggle sidebar' },
  FULLSCREEN: { key: 'f', ctrl: true, description: 'Toggle fullscreen' },

  // Help
  HELP: { key: '?', shift: true, description: 'Show keyboard shortcuts' },
} as const;

// Shortcut help component data
export function getShortcutHelp(): Array<{ category: string; shortcuts: KeyboardShortcut[] }> {
  return [
    {
      category: 'Navigation',
      shortcuts: [
        { id: 'search', key: 'k', ctrl: true, action: () => {}, description: 'Open search' },
        { id: 'go-home', key: 'g', action: () => {}, description: 'Go to home' },
        { id: 'go-back', key: 'Escape', action: () => {}, description: 'Go back / Close' },
      ],
    },
    {
      category: 'Actions',
      shortcuts: [
        { id: 'save', key: 's', ctrl: true, action: () => {}, description: 'Save' },
        { id: 'refresh', key: 'r', ctrl: true, action: () => {}, description: 'Refresh' },
        { id: 'new', key: 'n', ctrl: true, action: () => {}, description: 'Create new' },
      ],
    },
    {
      category: 'View',
      shortcuts: [
        { id: 'sidebar', key: 'b', ctrl: true, action: () => {}, description: 'Toggle sidebar' },
        { id: 'fullscreen', key: 'f', ctrl: true, action: () => {}, description: 'Fullscreen' },
      ],
    },
  ];
}

export default useKeyboardShortcuts;
