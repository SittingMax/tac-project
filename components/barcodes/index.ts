/**
 * Universal Barcode System
 *
 * A comprehensive barcode solution for WGS Portal logistics dashboard.
 * Supports screen scanning, printing, PDF export, and compact displays.
 *
 * Quick Start:
 * ```typescript
 * import { UniversalBarcode, ScreenBarcode, PrintBarcode } from '@/components/barcodes';
 *
 * // Screen scanning (default)
 * <ScreenBarcode value="WGS123456789" />
 *
 * // Print labels
 * <PrintBarcode value={awb} />
 *
 * // Custom mode
 * <UniversalBarcode value={awb} mode="screen" width={8} height={120} />
 * ```
 */

// Main components
export {
  UniversalBarcode,
  UniversalBarcodePreset,
  ScreenBarcode,
  PrintBarcode,
  PDFBarcode,
  TableBarcode,
  generateBarcodeDataURL,
} from './UniversalBarcode';

// Presets
export {
  BarcodePresets,
  QuickPresets,
  getPreset,
  getPresetsByMode,
  getPresetsByFormat,
} from './BarcodePresets';

// Types
export type {
  BarcodeMode,
  BarcodeFormat,
  BarcodeModeConfig,
  BarcodeProps,
  BarcodePreset,
} from './types';

export { MODE_CONFIGS } from './types';

// Utilities
export {
  isValidAWB,
  formatAWB,
  detectBarcodeMode,
  isScannerAvailable,
  getRecommendedSize,
  calculateBarcodeDimensions,
  generateBarcodeFilename,
  shouldBarcodeNavigate,
  getBarcodeClickHandler,
} from './utils';
