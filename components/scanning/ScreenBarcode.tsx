import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface ScreenBarcodeProps {
  value: string;
  width?: number; // Default: 6 (optimal for screen scanning)
  height?: number; // Default: 100 (taller for easier scanning)
  displayValue?: boolean; // Default: true (show human-readable text)
  className?: string;
  fontSize?: number; // Default: 16
  margin?: number; // Default: 15 (quiet zones)
}

/**
 * ScreenBarcode - Optimized for scanning barcodes displayed on computer screens
 *
 * Key differences from print barcodes:
 * - Wider bars (6px vs 2px) for LCD screen readability
 * - Taller height (100px vs 40px) for easier targeting
 * - Larger quiet zones (15px margin) to handle screen glare
 * - Pure black/white colors for maximum contrast
 * - Human-readable text below barcode as fallback
 *
 * Usage:
 *   <ScreenBarcode value="WGS123456789" />
 *   <ScreenBarcode value={awb} width={8} height={120} />
 *
 * Compatible with: Helett HT20, most USB/wireless 1D barcode scanners
 */
export const ScreenBarcode: React.FC<ScreenBarcodeProps> = ({
  value,
  width = 6,
  height = 100,
  displayValue = true,
  fontSize = 16,
  margin = 15,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128', // Most versatile 1D barcode format
          width, // Bar width in pixels
          height, // Total barcode height in pixels
          displayValue, // Show text below barcode
          fontSize, // Text size
          margin, // White space around barcode (quiet zones)
          background: '#FFFFFF', // Pure white background (critical for screen)
          lineColor: '#000000', // Pure black bars (max contrast)
          textMargin: 5, // Space between bars and text
          font: 'monospace', // Fixed-width font for consistency
          fontOptions: 'bold', // Bold text for better visibility
          textAlign: 'center', // Center-align the text
        });
      } catch (e) {
        console.error('[ScreenBarcode] Generation failed:', e, { value });
      }
    }
  }, [value, width, height, displayValue, fontSize, margin]);

  if (!value) {
    return null;
  }

  return (
    <div
      className={`screen-barcode-container ${className}`}
      style={{
        display: 'inline-block',
        padding: '20px',
        background: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        // Prevent anti-aliasing blur that makes scanning harder
        imageRendering: 'crisp-edges',
      }}
    >
      <svg
        ref={svgRef}
        style={{
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
        }}
      />
    </div>
  );
};

/**
 * Quick size presets for common scenarios
 */
export const ScreenBarcodePresets = {
  /** Compact - for cards/tables (width: 5, height: 80) */
  compact: { width: 5, height: 80 },

  /** Standard - recommended default (width: 6, height: 100) */
  standard: { width: 6, height: 100 },

  /** Large - for difficult scanners (width: 8, height: 120) */
  large: { width: 8, height: 120 },

  /** XL - maximum size (width: 10, height: 150) */
  xl: { width: 10, height: 150 },
};
