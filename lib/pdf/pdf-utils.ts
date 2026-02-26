import { rgb } from 'pdf-lib';
import { generateBarcodeDataURL } from '@/components/barcodes';
import { formatCurrency } from '../utils';

export async function generate1DBarcode(text: string): Promise<string> {
  if (!text || text.length < 1) {
    console.warn('Barcode generation skipped: empty text');
    return '';
  }
  try {
    // CODE128 supports the full ASCII character set (0-127).
    // No character stripping — the encoded value must exactly match the
    // human-readable text printed below the barcode to avoid mismatches.
    const trimmed = text.trim().substring(0, 30);
    if (!trimmed) {
      console.warn('Barcode generation skipped: empty after trim');
      return '';
    }
    // Use UniversalBarcode system for consistent barcode generation
    return await generateBarcodeDataURL(trimmed, 'pdf');
  } catch (e) {
    console.error('Barcode generation failed for:', text, e);
    return '';
  }
}

export const safeCurrency = (amount: number) => formatCurrency(amount).replace(/₹/g, 'Rs. ');

// --- TRANSPORT ICON SVG PATHS (identical to LabelGenerator.tsx TransportIcon) ---
export const ICON_PATHS = {
  AIR: {
    d: 'M480 192H365.71L260.61 8.06A16.014 16.014 0 0 0 246.71 0h-65.5c-10.63 0-18.3 10.17-15.38 20.39L214.86 192H112l-43.2-57.6c-3.02-4.03-7.77-6.4-12.8-6.4H16.01C5.6 128-2.04 137.78.49 147.88L32 256L.49 364.12C-2.04 374.22 5.6 384 16.01 384H56c5.04 0 9.78-2.37 12.8-6.4L112 320h102.86l-49.03 171.6c-2.92 10.22 4.75 20.4 15.38 20.4h65.5c5.74 0 11.04-3.08 13.89-8.06L365.71 320H480c35.35 0 96-28.65 96-64s-60.65-64-96-64z',
    viewBox: '0 0 576 512',
  },
  TRUCK: {
    d: 'M3 13.5L2.25 12H7.5l-.6-1.5H2L1.25 9h7.8l-.6-1.5H1.11L.25 6H4a2 2 0 0 1 2-2h12v4h3l3 4v5h-2a3 3 0 0 1-3 3a3 3 0 0 1-3-3h-4a3 3 0 0 1-3 3a3 3 0 0 1-3-3H4v-3.5H3m16 5a1.5 1.5 0 0 0 1.5-1.5a1.5 1.5 0 0 0-1.5-1.5a1.5 1.5 0 0 0-1.5 1.5a1.5 1.5 0 0 0 1.5 1.5m1.5-9H18V12h4.46L20.5 9.5M9 18.5a1.5 1.5 0 0 0 1.5-1.5A1.5 1.5 0 0 0 9 15.5A1.5 1.5 0 0 0 7.5 17A1.5 1.5 0 0 0 9 18.5Z',
    viewBox: '0 0 24 24',
  },
};

export async function renderTransportIconPng(
  mode: 'AIR' | 'TRUCK',
  pixelSize: number,
  fillColor: string
): Promise<string> {
  const icon = mode === 'AIR' ? ICON_PATHS.AIR : ICON_PATHS.TRUCK;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}" width="${pixelSize}" height="${pixelSize}" fill="${fillColor}"><path d="${icon.d}"/></svg>`;
  const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(svg);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pixelSize;
      canvas.height = pixelSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, pixelSize, pixelSize);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to render transport icon SVG'));
    img.src = svgDataUrl;
  });
}

export const pdfDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
  } catch {
    return '-';
  }
};

// --- ENTERPRISE THEME TOKENS ---
export const C = {
  // Primary Structure
  NAVY: rgb(0.17, 0.18, 0.51), // #2B2D83 (WGS Primary)
  NAVY_DARK: rgb(0.12, 0.12, 0.38), // #1E1F61

  // Accents
  YELLOW: rgb(0.96, 0.64, 0.0), // #F5A400
  BLUE: rgb(0.18, 0.42, 1.0), // #2D6BFF

  // Grayscale
  BLACK: rgb(0, 0, 0),
  INK: rgb(0.04, 0.07, 0.13), // #0B1220 (Text)
  MUTED: rgb(0.4, 0.44, 0.52), // #667085 (Labels)
  BORDER: rgb(0.9, 0.92, 0.95), // #E6EAF2
  PANEL: rgb(0.95, 0.96, 1.0), // #F3F6FF (Light Blue/Gray Panel)
  WHITE: rgb(1, 1, 1),

  // Illustration Palette (RGB normalized 0-1)
  ILL_ORANGE_1: rgb(242 / 255, 161 / 255, 73 / 255), // #f2a149
  ILL_ORANGE_2: rgb(250 / 255, 177 / 255, 83 / 255), // #fab153
  ILL_ORANGE_3: rgb(255 / 255, 186 / 255, 110 / 255), // #ffba6e
  ILL_BROWN: rgb(147 / 255, 118 / 255, 97 / 255), // #937661
  ILL_ORANGE_4: rgb(237 / 255, 152 / 255, 59 / 255), // #ed983b
};

// --- PROFESSIONAL SHIPPING LABEL GENERATOR (B&W Reference Match) ---
