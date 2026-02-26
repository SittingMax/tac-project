/**
 * Barcode Types and Interfaces
 *
 * Centralized type definitions for the universal barcode system
 */

export type BarcodeMode = 'screen' | 'print' | 'pdf' | 'compact';

export type BarcodeFormat = 'CODE128' | 'CODE39' | 'EAN13' | 'QR';

export interface BarcodeModeConfig {
  width: number;
  height: number;
  margin: number;
  displayValue: boolean;
  fontSize: number;
  background: string;
  lineColor: string;
}

export interface BarcodeProps {
  value: string;
  mode?: BarcodeMode;
  format?: BarcodeFormat;
  className?: string;
  onError?: (error: Error) => void;

  // Manual overrides (optional)
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  margin?: number;
}

export interface BarcodePreset {
  mode: BarcodeMode;
  format: BarcodeFormat;
  config: Partial<BarcodeModeConfig>;
  description: string;
  useCase: string;
}

export const MODE_CONFIGS: Record<BarcodeMode, BarcodeModeConfig> = {
  screen: {
    width: 6,
    height: 100,
    margin: 15,
    displayValue: true,
    fontSize: 16,
    background: '#FFFFFF',
    lineColor: '#000000',
  },
  print: {
    width: 3,
    height: 60,
    margin: 8,
    displayValue: true,
    fontSize: 12,
    background: '#FFFFFF',
    lineColor: '#000000',
  },
  pdf: {
    width: 4,
    height: 80,
    margin: 10,
    displayValue: false,
    fontSize: 14,
    background: '#FFFFFF',
    lineColor: '#000000',
  },
  compact: {
    width: 5,
    height: 80,
    margin: 10,
    displayValue: true,
    fontSize: 14,
    background: '#FFFFFF',
    lineColor: '#000000',
  },
};
