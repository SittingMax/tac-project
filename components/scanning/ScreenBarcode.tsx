/**
 * ScreenBarcode — Legacy re-export
 *
 * This file now re-exports from the UniversalBarcode wrapper to comply
 * with the project's barcode compliance guard (no direct JsBarcode imports
 * outside UniversalBarcode).
 *
 * For new code, import directly from '@/components/barcodes':
 *   import { ScreenBarcode } from '@/components/barcodes';
 */

export { ScreenBarcode, ScreenBarcode as default } from '@/components/barcodes/UniversalBarcode';
export { ScreenBarcodePresets } from './ScreenBarcodePresets';
