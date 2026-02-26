import { createContext, useContext } from 'react';
import { ScanSource } from '@/types';

export type ScanCallback = (data: string, source: ScanSource) => void;

export interface ScanDebugEvent {
  type: 'keystroke' | 'submit' | 'reset';
  key?: string;
  buffer: string;
  timings: number[];
  delay?: number;
  scannerDetected: boolean;
  timestamp: number;
}

export type DebugCallback = (event: ScanDebugEvent) => void;

export interface ScanningContextType {
  scan: () => Promise<string>;
  isScanning: boolean;
  cancelScan: () => void;
  subscribe: (callback: ScanCallback) => () => void;
  subscribeDebug: (callback: DebugCallback) => () => void;
}

export const ScanningContext = createContext<ScanningContextType | undefined>(undefined);

export function useScanner() {
  const context = useContext(ScanningContext);
  if (!context) {
    throw new Error('useScanner must be used within a ScanningProvider');
  }
  return context;
}
