/**
 * Barcode Utility Functions
 */

import type { BarcodeMode } from './types';

// Re-export from canonical source — single source of truth for CN validation
export { isValidAWB } from '@/lib/scanParser';

/**
 * Format AWB for display
 */
export function formatAWB(awb: string): string {
  return awb.toUpperCase().trim();
}

/**
 * Detect optimal barcode mode based on context
 */
export function detectBarcodeMode(): BarcodeMode {
  // Check if we're in print context
  if (window.matchMedia('print').matches) {
    return 'print';
  }

  // Check if we're generating PDF
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== 'undefined' && (window as any).isPDFContext) {
    return 'pdf';
  }

  // Default to screen
  return 'screen';
}

/**
 * Check if scanner hardware is available
 */
export function isScannerAvailable(): boolean {
  // This is a simple check - could be enhanced with actual hardware detection
  return typeof navigator !== 'undefined' && 'usb' in navigator;
}

/**
 * Get recommended barcode size for viewport
 */
export function getRecommendedSize(viewportWidth: number): {
  width: number;
  height: number;
} {
  if (viewportWidth < 640) {
    // Mobile: smaller barcode
    return { width: 5, height: 80 };
  } else if (viewportWidth < 1024) {
    // Tablet: standard barcode
    return { width: 6, height: 100 };
  } else {
    // Desktop: larger barcode
    return { width: 7, height: 110 };
  }
}

/**
 * Calculate barcode dimensions (pixels)
 */
export function calculateBarcodeDimensions(
  value: string,
  width: number,
  margin: number = 10
): {
  totalWidth: number;
  totalHeight: number;
} {
  // Rough estimation (actual size determined by JsBarcode)
  const charWidth = width * 11; // CODE128 typically 11 bars per character
  const totalWidth = value.length * charWidth + margin * 2;
  const totalHeight = 100 + margin * 2; // Standard height + margins

  return { totalWidth, totalHeight };
}

/**
 * Generate barcode filename
 */
export function generateBarcodeFilename(awb: string, format: 'png' | 'svg' = 'png'): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `barcode-${awb}-${timestamp}.${format}`;
}

/**
 * Check if barcode should be clickable (for navigation)
 */
export function shouldBarcodeNavigate(
  context: 'dashboard' | 'scanning' | 'manifests' | 'shipments'
): boolean {
  // Don't navigate from scanning page (local handling)
  if (context === 'scanning') {
    return false;
  }

  // Navigate from other pages
  return true;
}

/**
 * Get barcode click handler
 */
export function getBarcodeClickHandler(awb: string, context: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!shouldBarcodeNavigate(context as any)) {
    return undefined;
  }

  return () => {
    // Navigate to invoice page for the scanned AWB
    window.location.href = `/finance?awb=${encodeURIComponent(awb)}`;
  };
}
