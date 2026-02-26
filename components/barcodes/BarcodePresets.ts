/**
 * Barcode Presets Library
 *
 * Pre-configured barcode settings for common use cases
 */

import type { BarcodePreset, BarcodeMode, BarcodeFormat } from './types';

export const BarcodePresets: Record<string, BarcodePreset> = {
  // Screen scanning (default for interactive pages)
  screenScan: {
    mode: 'screen',
    format: 'CODE128',
    config: {
      width: 6,
      height: 100,
      margin: 15,
      displayValue: true,
    },
    description: 'Optimized for scanning from computer screens',
    useCase: 'Dashboard, Manifests, Shipments tables',
  },

  // Shipping labels (print)
  shippingLabel: {
    mode: 'print',
    format: 'CODE128',
    config: {
      width: 3,
      height: 60,
      margin: 8,
      displayValue: true,
    },
    description: 'Standard size for printed shipping labels',
    useCase: 'Label printing, physical labels',
  },

  // PDF export
  pdfExport: {
    mode: 'pdf',
    format: 'CODE128',
    config: {
      width: 4,
      height: 80,
      margin: 10,
      displayValue: false,
    },
    description: 'Optimized for PDF document generation',
    useCase: 'Invoice PDFs, manifest PDFs',
  },

  // Table display (compact)
  tableDisplay: {
    mode: 'compact',
    format: 'CODE128',
    config: {
      width: 5,
      height: 80,
      margin: 10,
      displayValue: true,
    },
    description: 'Compact size for table cells',
    useCase: 'Shipments table, manifest items table',
  },

  // Large screen (for difficult scanners)
  screenLarge: {
    mode: 'screen',
    format: 'CODE128',
    config: {
      width: 8,
      height: 120,
      margin: 20,
      displayValue: true,
      fontSize: 18,
    },
    description: 'Extra large for difficult scanners or poor lighting',
    useCase: 'Scanning page, test barcodes',
  },

  // Extra compact (for tight spaces)
  miniDisplay: {
    mode: 'compact',
    format: 'CODE128',
    config: {
      width: 4,
      height: 60,
      margin: 5,
      displayValue: true,
      fontSize: 10,
    },
    description: 'Minimal size for badges or small displays',
    useCase: 'Badges, tooltips, small cards',
  },

  // High contrast print
  printHighContrast: {
    mode: 'print',
    format: 'CODE128',
    config: {
      width: 4,
      height: 70,
      margin: 10,
      displayValue: true,
      background: '#FFFFFF',
      lineColor: '#000000',
    },
    description: 'Maximum contrast for reliable printing',
    useCase: 'Production labels, warehouse labels',
  },
};

/**
 * Get a preset by name with type safety
 */
export function getPreset(presetName: keyof typeof BarcodePresets): BarcodePreset {
  return BarcodePresets[presetName];
}

/**
 * Get all presets for a specific mode
 */
export function getPresetsByMode(mode: BarcodeMode): BarcodePreset[] {
  return Object.values(BarcodePresets).filter((preset) => preset.mode === mode);
}

/**
 * Get all presets for a specific format
 */
export function getPresetsByFormat(format: BarcodeFormat): BarcodePreset[] {
  return Object.values(BarcodePresets).filter((preset) => preset.format === format);
}

/**
 * Quick access to commonly used presets
 */
export const QuickPresets = {
  /** Default for screen scanning */
  screen: BarcodePresets.screenScan,

  /** Default for printing */
  print: BarcodePresets.shippingLabel,

  /** Default for PDF */
  pdf: BarcodePresets.pdfExport,

  /** Default for tables */
  table: BarcodePresets.tableDisplay,

  /** Large screen barcode */
  large: BarcodePresets.screenLarge,

  /** Mini barcode */
  mini: BarcodePresets.miniDisplay,
};
