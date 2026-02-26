/**
 * ScanContext Provider
 *
 * Manages the active scanning context to coordinate between global scan navigation
 * and local scan handling (e.g., manifest builder, scanning page).
 *
 * **Problem Solved:**
 * When scanning in manifest builder, both the local handler (add to manifest)
 * and global handler (navigate to shipment) were triggered. This context system
 * allows local handlers to temporarily "own" scan events and prevent global navigation.
 *
 * **Usage:**
 * ```typescript
 * // In a component that needs local scan handling:
 * const { setActiveContext } = useScanContext();
 *
 * useEffect(() => {
 *   setActiveContext('MANIFEST_BUILDER'); // Take ownership
 *   return () => setActiveContext('GLOBAL'); // Release ownership
 * }, [setActiveContext]);
 * ```
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ScanContextType =
  | 'GLOBAL' // Default: global navigation enabled
  | 'MANIFEST_BUILDER' // Building manifest: add items locally, no navigation
  | 'SCANNING_PAGE' // Dedicated scanning page: process locally
  | 'ARRIVAL_AUDIT' // Arrival audit page: reconcile manifest items
  | 'DISABLED'; // Scanning disabled

export interface ScanContextValue {
  /** Current active scan context */
  activeContext: ScanContextType;

  /** Set the active scan context (used by components to register/unregister) */
  setActiveContext: (context: ScanContextType) => void;

  /** Helper: Check if global navigation is allowed */
  canNavigate: () => boolean;
}

const ScanContextContext = createContext<ScanContextValue | undefined>(undefined);

export const ScanContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeContext, setActiveContext] = useState<ScanContextType>('GLOBAL');

  const canNavigate = useCallback(() => {
    return activeContext === 'GLOBAL';
  }, [activeContext]);

  const value: ScanContextValue = {
    activeContext,
    setActiveContext,
    canNavigate,
  };

  return <ScanContextContext.Provider value={value}>{children}</ScanContextContext.Provider>;
};

/**
 * Hook to access scan context
 *
 * @throws {Error} If used outside ScanContextProvider
 */
export const useScanContext = (): ScanContextValue => {
  const context = useContext(ScanContextContext);
  if (!context) {
    throw new Error('useScanContext must be used within a ScanContextProvider');
  }
  return context;
};
