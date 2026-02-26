/**
 * UniversalBarcode Component
 *
 * A unified barcode component that automatically adjusts for different contexts:
 * - Screen display (scannable from LCD screens)
 * - Print output (optimized for paper)
 * - PDF generation (embedded in documents)
 * - Compact display (tables, cards)
 *
 * Usage:
 *   <UniversalBarcode value="WGS123456789" mode="screen" />
 *   <UniversalBarcode value={awb} mode="print" />
 *   <UniversalBarcode value={awb} preset="screenLarge" />
 */

import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import type { BarcodeProps, BarcodeModeConfig } from './types';
import { MODE_CONFIGS } from './types';
import { BarcodePresets } from './BarcodePresets';

export const UniversalBarcode: React.FC<BarcodeProps> = ({
  value,
  mode = 'screen',
  format = 'CODE128',
  className = '',
  onError,

  // Manual overrides
  width,
  height,
  displayValue,
  fontSize,
  margin,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) {
      return;
    }

    try {
      // Get base configuration for the mode
      const baseConfig: BarcodeModeConfig = MODE_CONFIGS[mode];

      // Apply manual overrides
      const config = {
        format,
        width: width ?? baseConfig.width,
        height: height ?? baseConfig.height,
        margin: margin ?? baseConfig.margin,
        displayValue: displayValue ?? baseConfig.displayValue,
        fontSize: fontSize ?? baseConfig.fontSize,
        background: baseConfig.background,
        lineColor: baseConfig.lineColor,
        textMargin: 5,
        font: 'monospace',
        fontOptions: 'bold',
        textAlign: 'center' as const,
      };

      // Generate barcode
      JsBarcode(svgRef.current, value, config);
    } catch (error) {
      console.error('[UniversalBarcode] Generation failed:', error, { value, mode, format });
      if (onError) {
        onError(error as Error);
      }
    }
  }, [value, mode, format, width, height, displayValue, fontSize, margin, onError]);

  if (!value) {
    return null;
  }

  const modeConfig = MODE_CONFIGS[mode];

  return (
    <div
      className={`barcode-container barcode-mode-${mode} ${className}`}
      style={{
        display: 'inline-block',
        padding: mode === 'screen' ? '20px' : '10px',
        background: modeConfig.background,
        borderRadius: mode === 'screen' ? '8px' : '4px',
        boxShadow: mode === 'screen' ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
        // Prevent anti-aliasing blur for better scanning
        imageRendering: 'crisp-edges',
      }}
      data-barcode-value={value}
      data-barcode-mode={mode}
    >
      <svg
        ref={svgRef}
        style={{
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
        }}
        aria-label={`Barcode: ${value}`}
      />
    </div>
  );
};

/**
 * UniversalBarcode with preset
 *
 * Usage:
 *   <UniversalBarcodePreset value={awb} preset="screenScan" />
 *   <UniversalBarcodePreset value={awb} preset="shippingLabel" />
 */
export const UniversalBarcodePreset: React.FC<{
  value: string;
  preset: keyof typeof BarcodePresets;
  className?: string;
  onError?: (error: Error) => void;
}> = ({ value, preset, className, onError }) => {
  const presetConfig = BarcodePresets[preset];

  return (
    <UniversalBarcode
      value={value}
      mode={presetConfig.mode}
      format={presetConfig.format}
      className={className}
      onError={onError}
      {...presetConfig.config}
    />
  );
};

/**
 * Quick access components for common use cases
 */
export const ScreenBarcode: React.FC<{ value: string; className?: string }> = (props) => (
  <UniversalBarcodePreset {...props} preset="screenScan" />
);

export const PrintBarcode: React.FC<{ value: string; className?: string }> = (props) => (
  <UniversalBarcodePreset {...props} preset="shippingLabel" />
);

export const PDFBarcode: React.FC<{ value: string; className?: string }> = (props) => (
  <UniversalBarcodePreset {...props} preset="pdfExport" />
);

export const TableBarcode: React.FC<{ value: string; className?: string }> = (props) => (
  <UniversalBarcodePreset {...props} preset="tableDisplay" />
);

/**
 * Generate barcode as data URL (for PDF/image export)
 */
export async function generateBarcodeDataURL(
  value: string,
  mode: BarcodeProps['mode'] = 'pdf'
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const config = MODE_CONFIGS[mode];

      JsBarcode(canvas, value, {
        format: 'CODE128',
        ...config,
      });

      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    } catch (error) {
      reject(error);
    }
  });
}
