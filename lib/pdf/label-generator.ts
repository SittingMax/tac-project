import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { C, generate1DBarcode, renderTransportIconPng, pdfDate } from './pdf-utils';
import { Shipment } from '../../types';
import type { LabelData } from '@/components/domain/LabelGenerator';
import { HUBS } from '../constants';
import { logger } from '../logger';

type ExtendedShipment = Shipment & {
  paymentMode?: string;
  gstNumber?: string;
};

export async function generateShipmentLabel(shipment: Shipment): Promise<string> {
  logger.debug('[Label] Starting generation', { awb: shipment.awb });

  if (!shipment || !shipment.awb) {
    throw new Error('Invalid shipment data: missing CN');
  }

  const pdfDoc = await PDFDocument.create();
  // 4x6 inch label (288 x 432 points)
  const page = pdfDoc.addPage([288, 432]);
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  logger.debug('[Label] PDF document created, embedding fonts...');

  // Background and Main Border
  page.drawRectangle({ x: 0, y: 0, width, height, color: C.WHITE });
  page.drawRectangle({
    x: 8,
    y: 8,
    width: width - 16,
    height: height - 16,
    borderWidth: 2,
    borderColor: C.BLACK,
  });

  let y = height - 12; // Start inside border

  // --- TOP SECTION (Header + Truck) ---
  // Height approx 90pts
  // Line below header
  const yHeaderBottom = y - 90;
  page.drawLine({
    start: { x: 8, y: yHeaderBottom },
    end: { x: width - 8, y: yHeaderBottom },
    thickness: 2,
    color: C.BLACK,
  });

  // "STANDARD EXPRESS"
  page.drawText('STANDARD EXPRESS', { x: 16, y: y - 16, size: 7, font: fontBold, color: C.MUTED });

  // Barcode & AWB
  y -= 30;
  const barcodeDataUrl = await generate1DBarcode(shipment.awb);
  logger.debug('[Label] Barcode generated', { success: !!barcodeDataUrl });
  if (barcodeDataUrl) {
    try {
      const barcodeImg = await pdfDoc.embedPng(barcodeDataUrl);
      page.drawImage(barcodeImg, { x: 16, y: y - 40, width: 160, height: 45 });
    } catch (barcodeErr) {
      console.error('[Label] Failed to embed barcode image:', barcodeErr);
      // Continue without barcode
    }
  }
  page.drawText(shipment.awb || 'NO-CN', { x: 50, y: y - 52, size: 14, font: fontBold });

  // Transport Icon Section (Right side)
  // Vertical separator for icon box
  const xTruckBox = width - 100;
  page.drawLine({
    start: { x: xTruckBox, y: height - 8 },
    end: { x: xTruckBox, y: yHeaderBottom },
    thickness: 2,
    color: C.BLACK,
  });

  // Transport Icon — draw airplane for AIR, truck for TRUCK
  const isAir = shipment.mode === 'AIR';
  if (isAir) {
    // Airplane silhouette (simple geometric)
    const cx = xTruckBox + (width - 8 - xTruckBox) / 2;
    const cy = y - 15;
    // Fuselage
    page.drawRectangle({ x: cx - 20, y: cy - 3, width: 40, height: 6, color: C.BLACK });
    // Wings
    page.drawRectangle({ x: cx - 8, y: cy - 12, width: 16, height: 24, color: C.BLACK });
    // Tail fin
    page.drawRectangle({ x: cx - 22, y: cy, width: 8, height: 10, color: C.BLACK });
    // Nose
    page.drawCircle({ x: cx + 20, y: cy, size: 4, color: C.BLACK });
  } else {
    // Truck Icon (Black silhouette style)
    // Cab
    page.drawRectangle({ x: width - 35, y: y - 20, width: 20, height: 18, color: C.BLACK });
    // Cargo
    page.drawRectangle({ x: xTruckBox + 15, y: y - 30, width: 35, height: 28, color: C.BLACK });
    // Wheels
    page.drawCircle({ x: width - 25, y: y - 22, size: 5, color: C.BLACK });
    page.drawCircle({ x: xTruckBox + 30, y: y - 22, size: 5, color: C.BLACK });
  }

  // Small grids below truck
  const ySmallGrid = yHeaderBottom + 35;
  page.drawLine({
    start: { x: xTruckBox, y: ySmallGrid },
    end: { x: width - 8, y: ySmallGrid },
    thickness: 1,
    color: C.BLACK,
  });

  // 1 kg | STD
  const xMidSmall = xTruckBox + (width - 8 - xTruckBox) / 2;
  page.drawLine({
    start: { x: xMidSmall, y: ySmallGrid },
    end: { x: xMidSmall, y: yHeaderBottom + 18 },
    thickness: 1,
    color: C.BLACK,
  }); // vertical split

  // Horizontal split for TO PAY
  page.drawLine({
    start: { x: xTruckBox, y: yHeaderBottom + 18 },
    end: { x: width - 8, y: yHeaderBottom + 18 },
    thickness: 1,
    color: C.BLACK,
  });

  page.drawText(`${shipment.totalWeight.chargeable} kg`, {
    x: xTruckBox + 5,
    y: ySmallGrid - 10,
    size: 9,
    font: fontBold,
  });
  page.drawText('STD', { x: xMidSmall + 5, y: ySmallGrid - 10, size: 9, font: fontBold });

  // TO PAY (Gray background)
  page.drawRectangle({
    x: xTruckBox + 1,
    y: yHeaderBottom + 1,
    width: width - 8 - xTruckBox - 2,
    height: 16,
    color: rgb(0.9, 0.9, 0.9),
  });
  const payMode = (shipment as ExtendedShipment).paymentMode || 'TO PAY';
  page.drawText(payMode, { x: xTruckBox + 20, y: yHeaderBottom + 6, size: 9, font: fontBold });

  // --- SHIP TO SECTION ---
  y = yHeaderBottom; // Move y down
  const yShipToBottom = y - 90;
  page.drawLine({
    start: { x: 8, y: yShipToBottom },
    end: { x: width - 8, y: yShipToBottom },
    thickness: 2,
    color: C.BLACK,
  });

  page.drawText('SHIP TO', { x: 16, y: y - 16, size: 7, font: fontBold, color: C.MUTED });

  const consigneeName = (
    shipment.consignee?.name ||
    shipment.customerName ||
    'CUSTOMER'
  ).toUpperCase();
  page.drawText(consigneeName, { x: 16, y: y - 40, size: 20, font: fontBold });

  const destHub = HUBS[shipment.destinationHub] || { name: 'Unknown', code: 'UNK' };
  const address =
    shipment.consignee?.address || `${destHub.name} Airport Road, Imphal, Manipur 795001`; // fallback
  const city = shipment.consignee?.city || destHub.name;

  page.drawText(address.substring(0, 45), { x: 16, y: y - 60, size: 9, font });
  page.drawText(city, { x: 16, y: y - 72, size: 9, font });
  page.drawText(destHub.name, { x: 16, y: y - 84, size: 9, font: fontBold });

  // --- SORTING GRIDS (DELIVERY STATION | ORIGIN SORT | DEST SORT) ---
  y = yShipToBottom;
  const ySortBottom = y - 70;
  page.drawLine({
    start: { x: 8, y: ySortBottom },
    end: { x: width - 8, y: ySortBottom },
    thickness: 2,
    color: C.BLACK,
  });

  // Vertical lines
  const colW = (width - 16) / 3;
  page.drawLine({
    start: { x: 8 + colW, y },
    end: { x: 8 + colW, y: ySortBottom },
    thickness: 1,
    color: C.BLACK,
  });
  page.drawLine({
    start: { x: 8 + colW * 2, y },
    end: { x: 8 + colW * 2, y: ySortBottom },
    thickness: 1,
    color: C.BLACK,
  });

  const originHub = HUBS[shipment.originHub] || { code: 'DEL' };

  // Col 1
  page.drawText('DELIVERY STATION', { x: 16, y: y - 15, size: 6, font: fontBold, color: C.MUTED });
  page.drawText(destHub.code || 'IMF', { x: 16, y: y - 55, size: 36, font: fontBold });
  // Col 2
  page.drawText('ORIGIN SORT', {
    x: 16 + colW,
    y: y - 15,
    size: 6,
    font: fontBold,
    color: C.MUTED,
  });
  page.drawText(originHub.code || 'DEL', { x: 16 + colW, y: y - 55, size: 36, font: fontBold });
  // Col 3
  page.drawText('DEST SORT', {
    x: 16 + colW * 2,
    y: y - 15,
    size: 6,
    font: fontBold,
    color: C.MUTED,
  });
  page.drawText(destHub.code || 'SUR', { x: 16 + colW * 2, y: y - 55, size: 36, font: fontBold });

  // --- DATA ROW (Ship Date | GST | Invoice Date) ---
  y = ySortBottom;
  const yDataBottom = y - 30;
  page.drawLine({
    start: { x: 8, y: yDataBottom },
    end: { x: width - 8, y: yDataBottom },
    thickness: 2,
    color: C.BLACK,
  }); // Bold separator

  // Vertical splits for data row - align with columns or custom? Reference shows equal thirds roughly
  page.drawLine({
    start: { x: 8 + colW, y },
    end: { x: 8 + colW, y: yDataBottom },
    thickness: 1,
    color: C.BLACK,
  });
  page.drawLine({
    start: { x: 8 + colW * 2, y },
    end: { x: 8 + colW * 2, y: yDataBottom },
    thickness: 1,
    color: C.BLACK,
  });

  // Col 1: Ship Date
  page.drawText('SHIP DATE', { x: 16, y: y - 10, size: 5, font: fontBold, color: C.MUTED });
  page.drawText(pdfDate(shipment.createdAt), { x: 16, y: y - 22, size: 9, font: fontBold });
  // Col 2: GST
  page.drawText('GST NUMBER', { x: 16 + colW, y: y - 10, size: 5, font: fontBold, color: C.MUTED });
  page.drawText((shipment as ExtendedShipment).gstNumber || '07AAMFT6165B1Z3', {
    x: 16 + colW,
    y: y - 22,
    size: 8,
    font: fontBold,
  });
  // Col 3: Invoice Date
  page.drawText('INVOICE DATE', {
    x: 16 + colW * 2,
    y: y - 10,
    size: 5,
    font: fontBold,
    color: C.MUTED,
  });
  page.drawText(pdfDate(shipment.createdAt), {
    x: 16 + colW * 2,
    y: y - 22,
    size: 9,
    font: fontBold,
  });

  // --- ROUTING SECTION (Fixed Layout) ---
  y = yDataBottom;
  const yRoutingBottom = y - 70;
  page.drawLine({
    start: { x: 8, y: yRoutingBottom },
    end: { x: width - 8, y: yRoutingBottom },
    thickness: 2,
    color: C.BLACK,
  });

  page.drawText('ROUTING', { x: 16, y: y - 15, size: 6, font: fontBold, color: C.MUTED });

  // Large DEL -> IMF (Adjusted margins)
  page.drawText(originHub.code || 'DEL', { x: 20, y: y - 55, size: 36, font: fontBold });

  // Vector Arrow (Shifted Left)
  const arrowStart = { x: 100, y: y - 45 };
  const arrowEnd = { x: 140, y: y - 45 };
  page.drawLine({ start: arrowStart, end: arrowEnd, thickness: 1.5, color: C.BLACK });
  page.drawLine({
    start: { x: arrowEnd.x - 5, y: arrowEnd.y + 3 },
    end: arrowEnd,
    thickness: 1.5,
    color: C.BLACK,
  });
  page.drawLine({
    start: { x: arrowEnd.x - 5, y: arrowEnd.y - 3 },
    end: arrowEnd,
    thickness: 1.5,
    color: C.BLACK,
  });

  page.drawText(destHub.code || 'IMF', { x: 150, y: y - 55, size: 36, font: fontBold });

  // Service Level Box (Right side, adjusted)
  const xService = width - 70;
  page.drawLine({
    start: { x: xService - 10, y },
    end: { x: xService - 10, y: yRoutingBottom },
    thickness: 2,
    color: C.BLACK,
  });

  page.drawText('SERVICE LEVEL', {
    x: xService - 2,
    y: y - 15,
    size: 5,
    font: fontBold,
    color: C.MUTED,
  });
  page.drawRectangle({
    x: xService,
    y: y - 55,
    width: 55,
    height: 30,
    borderWidth: 2,
    borderColor: C.BLACK,
  });

  const serviceLevel = shipment.serviceLevel === 'EXPRESS' ? 'X-09' : 'S-01';
  page.drawText(serviceLevel, { x: xService + 8, y: y - 45, size: 14, font: fontBold });

  // --- CONTENTS & FOOTER ---
  y = yRoutingBottom;

  // Contents
  page.drawText('CONTENTS', { x: 16, y: y - 15, size: 6, font: fontBold, color: C.MUTED });
  const contents = shipment.contentsDescription || 'GENERAL GOODS';
  page.drawText(contents.toUpperCase(), { x: 16, y: y - 35, size: 12, font: fontBold });

  page.drawText('QTY', { x: width - 40, y: y - 15, size: 6, font: fontBold, color: C.MUTED });
  page.drawText(String(shipment.totalPackageCount || 1).padStart(2, '0'), {
    x: width - 40,
    y: y - 35,
    size: 12,
    font: fontBold,
  });

  // Bottom Footer
  const yFooter = 25;
  page.drawLine({
    start: { x: 8, y: yFooter },
    end: { x: width - 8, y: yFooter },
    thickness: 1,
    color: C.MUTED,
  });

  page.drawText('Liability limited to conditions of carriage.', {
    x: 16,
    y: 14,
    size: 5,
    font,
    color: C.MUTED,
  });
  page.drawText('© 2026 TAC.', { x: 16, y: 8, size: 5, font, color: C.MUTED });

  // TAC branding
  const xBrand = width - 80;
  page.drawRectangle({
    x: xBrand,
    y: 8,
    width: 10,
    height: 10,
    borderWidth: 3,
    borderColor: C.BLACK,
  }); // Square icon
  page.drawText('W', { x: xBrand + 14, y: 8, size: 12, font: fontBold, color: C.BLACK });
  page.drawText('EE', { x: xBrand + 30, y: 8, size: 12, font, color: C.BLACK });

  logger.debug('[Label] Saving PDF...');
  const pdfBytes = await pdfDoc.save();
  const url = URL.createObjectURL(new Blob([pdfBytes as BlobPart], { type: 'application/pdf' }));
  logger.debug('[Label] PDF generated successfully');
  return url;
}

// --- LABEL PDF GENERATOR (Pixel-matched to LabelGenerator.tsx HTML preview) ---
// All dimensions derived from LabelGenerator.tsx CSS at scale 0.75 (288pt / 384px)
export async function generateLabelPDF(data: LabelData): Promise<string> {
  logger.debug('[LabelPDF] Starting generation', { awb: data.awb });
  if (!data?.awb) throw new Error('Invalid label data: missing CN');

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);

  // Pre-render SVG transport icons as PNG (same SVG paths as LabelGenerator.tsx)
  const iconMode = data.transportMode === 'AIR' ? ('AIR' as const) : ('TRUCK' as const);
  const [metaIconDataUrl, headerIconDataUrl] = await Promise.all([
    renderTransportIconPng(iconMode, 64, '#18181b').catch(() => ''),
    renderTransportIconPng(iconMode, 42, '#ffffff').catch(() => ''),
  ]);

  // --- Design tokens (exact match to LabelGenerator.tsx CSS) ---
  const DARK = rgb(0.094, 0.094, 0.106); // #18181b
  const WHITE = rgb(1, 1, 1);
  const MUTED = rgb(0.443, 0.443, 0.478); // #71717a  (.sl-kicker, .sl-meta-unit, .sl-hub-name)
  const ADDR = rgb(0.247, 0.247, 0.275); // #3f3f46  (.sl-address)
  const ARROW = rgb(0.631, 0.631, 0.667); // #a1a1aa  (.sl-route-arrow)
  const LIGHT = rgb(0.98, 0.98, 0.98); // #fafafa  (.sl-footer)
  const B = 1.1; // border: 1.5px * 0.75 = 1.125

  // --- Layout constants ---
  // Width: 4 inches = 288pt. Scale: 288/384 = 0.75
  const W = 288;
  const META_W = 83; // HTML grid-template-columns: 1fr 110px → 110*0.75 = 82.5
  const BW = W - META_W; // barcode cell width = 205

  // Section heights (measured from CSS rendered heights × 0.75)
  // .sl-header:       padding 6px*2 + line 14px*1.3 = ~30px  → 23pt
  // .sl-barcode-row:  ~88px (barcode 40+4+awb 20 + padding 16 = 80; meta icon+grid = 88) → 66pt
  // .sl-paybar:       padding 3px*2 + line 11px*1.3 = ~20px  → 15pt
  // .sl-shipto:       padding 10*2 + kicker 12 + name 21 + addr 31 = ~84px → 63pt
  // .sl-route-strip:  min-height 64px → 48pt
  // .sl-details:      padding 8*2 + kicker 12 + val 16 = ~44px → 33pt
  // .sl-bottom-row:   padding 8*2 + kicker 12 + code 20 = ~48px → 36pt
  // .sl-footer:       padding 6*2 + badge 22 = ~34px → 26pt
  const hHeader = 23;
  const hBarcode = 66;
  const hPaybar = 15;
  const hShipTo = 63;
  const hRoute = 48;
  const hDetail = 33;
  const hSort = 36;
  const hFooter = 26;
  const H = hHeader + hBarcode + hPaybar + hShipTo + hRoute + hDetail + hSort + hFooter; // 310

  const page = pdfDoc.addPage([W, H]);

  // White background + outer border (CSS: border: 2px solid #18181b → 1.5pt)
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: WHITE });
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, borderWidth: 1.5, borderColor: DARK });

  let y = H;

  // ===== 1. HEADER BAR (.sl-header) =====
  y -= hHeader;
  page.drawRectangle({ x: 0, y, width: W, height: hHeader, color: DARK });

  // "TAC CARGO" (.sl-brand: 14px→10.5pt, weight 800, letter-spacing 2px→1.5pt)
  page.drawText('TAC', {
    x: 9,
    y: y + 7,
    size: 10.5,
    font: fontBold,
    color: WHITE,
  });

  // Service tag (.sl-service-tag: 10px→7.5pt, weight 700, uppercase)
  const svcName = (data.serviceName || 'STANDARD').toUpperCase();
  const svcNameW = fontBold.widthOfTextAtSize(svcName, 7.5);
  page.drawText(svcName, {
    x: W - svcNameW - 9,
    y: y + 7,
    size: 7.5,
    font: fontBold,
    color: WHITE,
  });

  // Mini transport icon (.sl-service-tag svg: 14px→10.5pt)
  const miniIconSize = 10.5;
  const miniX = W - svcNameW - miniIconSize - 12;
  const miniCy = y + hHeader / 2;
  if (headerIconDataUrl) {
    try {
      const miniImg = await pdfDoc.embedPng(headerIconDataUrl);
      page.drawImage(miniImg, {
        x: miniX,
        y: miniCy - miniIconSize / 2,
        width: miniIconSize,
        height: miniIconSize,
      });
    } catch {
      /* icon rendering failed, skip */
    }
  }

  // ===== 2. BARCODE + META ROW (.sl-barcode-row) =====
  const barcTop = y;
  y -= hBarcode;

  // Bottom border
  page.drawLine({ start: { x: 0, y }, end: { x: W, y }, thickness: B, color: DARK });
  // Vertical separator (between barcode cell and meta cell)
  page.drawLine({ start: { x: BW, y: barcTop }, end: { x: BW, y }, thickness: B, color: DARK });

  // Barcode image (.sl-barcode: height 40px→30pt, margin-bottom 4px→3pt)
  const barcodeDataUrl = await generate1DBarcode(data.awb);
  if (barcodeDataUrl) {
    try {
      const barcodeImg = await pdfDoc.embedPng(barcodeDataUrl);
      page.drawImage(barcodeImg, {
        x: 9,
        y: y + 22,
        width: BW - 18,
        height: 30,
      });
    } catch (err) {
      console.error('[LabelPDF] Barcode embed failed:', err);
    }
  }

  // AWB (.sl-CN: 15px→11.25pt, Courier New monospace, weight 900)
  page.drawText(data.awb, {
    x: 9,
    y: y + 5,
    size: 11,
    font: fontMono,
  });

  // --- Meta cell (.sl-meta-cell) ---
  // Split into icon area (top, flex:1) + 2-col grid (bottom)
  const metaGridH = 22; // bottom 2-col grid height
  const metaGridTop = y + metaGridH;

  // Horizontal separator between icon and grid (.sl-meta-icon border-bottom)
  page.drawLine({
    start: { x: BW, y: metaGridTop },
    end: { x: W, y: metaGridTop },
    thickness: B,
    color: DARK,
  });

  // Transport icon (.sl-meta-icon svg: 28px→21pt, centered in icon area)
  const iconSize = 21;
  const iconCx = BW + META_W / 2;
  const iconCy = metaGridTop + (barcTop - metaGridTop) / 2;
  if (metaIconDataUrl) {
    try {
      const metaImg = await pdfDoc.embedPng(metaIconDataUrl);
      page.drawImage(metaImg, {
        x: iconCx - iconSize / 2,
        y: iconCy - iconSize / 2,
        width: iconSize,
        height: iconSize,
      });
    } catch {
      /* icon rendering failed, skip */
    }
  }

  // Weight + Service Code grid (.sl-meta-grid: 2 columns)
  const metaMidX = BW + META_W / 2;
  const halfMeta = META_W / 2;
  // Vertical separator between weight and svc code
  page.drawLine({
    start: { x: metaMidX, y: metaGridTop },
    end: { x: metaMidX, y },
    thickness: B,
    color: DARK,
  });
  // First-child border-right (.sl-meta-item:first-child)

  // Weight (.sl-meta-val: 14px→10.5pt, .sl-meta-unit: 9px→6.75pt)
  const wVal = Number(data.weight || 0).toFixed(1);
  const wValW = fontBold.widthOfTextAtSize(wVal, 10.5);
  page.drawText(wVal, {
    x: BW + (halfMeta - wValW) / 2,
    y: y + metaGridH * 0.52,
    size: 10.5,
    font: fontBold,
  });
  const wUnit = data.weightUnit.toUpperCase();
  const wUnitW = fontBold.widthOfTextAtSize(wUnit, 6.5);
  page.drawText(wUnit, {
    x: BW + (halfMeta - wUnitW) / 2,
    y: y + 2,
    size: 6.5,
    font: fontBold,
    color: MUTED,
  });

  // Service code
  const sCode = data.serviceCode || 'STD';
  const sCodeW = fontBold.widthOfTextAtSize(sCode, 10.5);
  page.drawText(sCode, {
    x: metaMidX + (halfMeta - sCodeW) / 2,
    y: y + metaGridH * 0.52,
    size: 10.5,
    font: fontBold,
  });
  const sLabel = 'SVC';
  const sLabelW = fontBold.widthOfTextAtSize(sLabel, 6.5);
  page.drawText(sLabel, {
    x: metaMidX + (halfMeta - sLabelW) / 2,
    y: y + 2,
    size: 6.5,
    font: fontBold,
    color: MUTED,
  });

  // ===== 3. PAYMENT BAR (.sl-paybar) =====
  y -= hPaybar;
  page.drawRectangle({ x: 0, y, width: W, height: hPaybar, color: DARK });

  // (.sl-paybar: 11px→8.25pt, weight 800, letter-spacing 2px, uppercase, centered)
  const payText = (data.paymentMode || 'TO_PAY').toUpperCase();
  const payTW = fontBold.widthOfTextAtSize(payText, 8);
  page.drawText(payText, {
    x: (W - payTW) / 2,
    y: y + 4,
    size: 8,
    font: fontBold,
    color: WHITE,
  });

  // ===== 4. SHIP TO (.sl-shipto) =====
  const stTop = y;
  y -= hShipTo;
  page.drawLine({ start: { x: 0, y }, end: { x: W, y }, thickness: B, color: DARK });

  // Kicker (.sl-kicker: 9px→6.75pt, weight 800, uppercase, #71717a)
  page.drawText('SHIP TO', {
    x: 9,
    y: stTop - 10,
    size: 6.75,
    font: fontBold,
    color: MUTED,
  });

  // Recipient name (.sl-recipient-name: 18px→13.5pt, weight 900, uppercase)
  const name = (data.recipient.name || 'CONSIGNEE').toUpperCase();
  page.drawText(name.substring(0, 26), {
    x: 9,
    y: stTop - 25,
    size: 13.5,
    font: fontBold,
  });

  // Address (.sl-address: 11px→8.25pt, weight 500, #3f3f46, line-height 1.4)
  let addrY = stTop - 38;
  if (data.recipient.address) {
    page.drawText(data.recipient.address.substring(0, 55), {
      x: 9,
      y: addrY,
      size: 8,
      font,
      color: ADDR,
    });
    addrY -= 11;
  }
  const cityState = [data.recipient.city, data.recipient.state].filter(Boolean).join(', ');
  if (cityState) {
    page.drawText(cityState.substring(0, 55), {
      x: 9,
      y: addrY,
      size: 8,
      font,
      color: ADDR,
    });
  }

  // ===== 5. ROUTE STRIP (.sl-route-strip, min-height 64px→48pt) =====
  const rtTop = y;
  y -= hRoute;
  page.drawLine({ start: { x: 0, y }, end: { x: W, y }, thickness: B, color: DARK });

  const rColW = W / 3;

  // Origin (.sl-hub-code: 28px→21pt, weight 900; .sl-hub-name: 9px→6.75pt)
  const oCode = data.routing.origin || 'DEL';
  const oCodeW = fontBold.widthOfTextAtSize(oCode, 21);
  page.drawText(oCode, {
    x: (rColW - oCodeW) / 2,
    y: rtTop - 30,
    size: 21,
    font: fontBold,
  });
  const oLbl = 'ORIGIN';
  const oLblW = font.widthOfTextAtSize(oLbl, 6.75);
  page.drawText(oLbl, {
    x: (rColW - oLblW) / 2,
    y: rtTop - 40,
    size: 6.75,
    font,
    color: MUTED,
  });

  // Arrow (.sl-route-arrow: 20px→15pt, weight 300, #a1a1aa)
  const arrowCx = W / 2;
  const arrowY = rtTop - 28;
  page.drawLine({
    start: { x: arrowCx - 10, y: arrowY },
    end: { x: arrowCx + 10, y: arrowY },
    thickness: 1,
    color: ARROW,
  });
  page.drawLine({
    start: { x: arrowCx + 6, y: arrowY + 3 },
    end: { x: arrowCx + 10, y: arrowY },
    thickness: 1,
    color: ARROW,
  });
  page.drawLine({
    start: { x: arrowCx + 6, y: arrowY - 3 },
    end: { x: arrowCx + 10, y: arrowY },
    thickness: 1,
    color: ARROW,
  });

  // Destination
  const dCode = data.routing.destination || 'IMF';
  const dCodeW = fontBold.widthOfTextAtSize(dCode, 21);
  page.drawText(dCode, {
    x: rColW * 2 + (rColW - dCodeW) / 2,
    y: rtTop - 30,
    size: 21,
    font: fontBold,
  });
  const dLbl = 'DESTINATION';
  const dLblW = font.widthOfTextAtSize(dLbl, 6.75);
  page.drawText(dLbl, {
    x: rColW * 2 + (rColW - dLblW) / 2,
    y: rtTop - 40,
    size: 6.75,
    font,
    color: MUTED,
  });

  // ===== 6. DETAILS (.sl-details, 3-col grid) =====
  const dtTop = y;
  y -= hDetail;
  page.drawLine({ start: { x: 0, y }, end: { x: W, y }, thickness: B, color: DARK });

  const dColW = W / 3;
  page.drawLine({ start: { x: dColW, y: dtTop }, end: { x: dColW, y }, thickness: B, color: DARK });
  page.drawLine({
    start: { x: dColW * 2, y: dtTop },
    end: { x: dColW * 2, y },
    thickness: B,
    color: DARK,
  });

  // Ship Date (.sl-kicker 9px→6.75pt, .sl-detail-val 12px→9pt)
  page.drawText('SHIP DATE', { x: 8, y: dtTop - 10, size: 6.75, font: fontBold, color: MUTED });
  page.drawText(data.dates.shipDate || '-', { x: 8, y: dtTop - 22, size: 9, font: fontBold });

  // GST No. (monospace 11px→8pt)
  page.drawText('GST NO.', {
    x: dColW + 8,
    y: dtTop - 10,
    size: 6.75,
    font: fontBold,
    color: MUTED,
  });
  page.drawText((data.gstNumber || 'N/A').substring(0, 16), {
    x: dColW + 8,
    y: dtTop - 22,
    size: 8,
    font: fontMono,
  });

  // Invoice Date
  page.drawText('INVOICE DATE', {
    x: dColW * 2 + 8,
    y: dtTop - 10,
    size: 6.75,
    font: fontBold,
    color: MUTED,
  });
  page.drawText(data.dates.invoiceDate || '-', {
    x: dColW * 2 + 8,
    y: dtTop - 22,
    size: 9,
    font: fontBold,
  });

  // ===== 7. SORT / DELIVERY ROW (.sl-bottom-row, 3-col) =====
  const srTop = y;
  y -= hSort;
  page.drawLine({ start: { x: 0, y }, end: { x: W, y }, thickness: B, color: DARK });

  page.drawLine({ start: { x: dColW, y: srTop }, end: { x: dColW, y }, thickness: B, color: DARK });
  page.drawLine({
    start: { x: dColW * 2, y: srTop },
    end: { x: dColW * 2, y },
    thickness: B,
    color: DARK,
  });

  // Delivery Station (.sl-kicker + .sl-sort-code: 20px→15pt, centered)
  const delCode = data.routing.deliveryStation || 'IMF';
  page.drawText('DELIVERY STN', { x: 8, y: srTop - 10, size: 6.75, font: fontBold, color: MUTED });
  const delW = fontBold.widthOfTextAtSize(delCode, 15);
  page.drawText(delCode, { x: (dColW - delW) / 2, y: srTop - 27, size: 15, font: fontBold });

  // Origin Sort
  const orgCode = data.routing.originSort || 'DEL';
  page.drawText('ORIGIN SORT', {
    x: dColW + 8,
    y: srTop - 10,
    size: 6.75,
    font: fontBold,
    color: MUTED,
  });
  const orgW = fontBold.widthOfTextAtSize(orgCode, 15);
  page.drawText(orgCode, {
    x: dColW + (dColW - orgW) / 2,
    y: srTop - 27,
    size: 15,
    font: fontBold,
  });

  // Dest Sort
  const dstCode = data.routing.destSort || 'IMF';
  page.drawText('DEST SORT', {
    x: dColW * 2 + 8,
    y: srTop - 10,
    size: 6.75,
    font: fontBold,
    color: MUTED,
  });
  const dstW = fontBold.widthOfTextAtSize(dstCode, 15);
  page.drawText(dstCode, {
    x: dColW * 2 + (dColW - dstW) / 2,
    y: srTop - 27,
    size: 15,
    font: fontBold,
  });

  // ===== 8. FOOTER (.sl-footer: padding 6px*2 + badge 22px) =====
  // y should now be hFooter (26pt)
  page.drawRectangle({ x: 1, y: 1, width: W - 2, height: hFooter - 1, color: LIGHT });

  // T badge (.sl-footer-badge: 22px→16.5pt circle, border 2px→1.5pt)
  const badgeCx = W / 2 - 32;
  const badgeCy = hFooter / 2;
  page.drawCircle({
    x: badgeCx,
    y: badgeCy,
    size: 8,
    borderWidth: 1.5,
    borderColor: DARK,
    color: LIGHT,
  });
  const tCharW = fontBold.widthOfTextAtSize('T', 8);
  page.drawText('T', { x: badgeCx - tCharW / 2, y: badgeCy - 3, size: 8, font: fontBold });

  // "TAC Shipping" (.sl-footer-text: 12px→9pt, weight 800)
  page.drawText('TAC Shipping', {
    x: badgeCx + 12,
    y: badgeCy - 3.5,
    size: 9,
    font: fontBold,
  });

  // Save
  const pdfBytes = await pdfDoc.save();
  const url = URL.createObjectURL(new Blob([pdfBytes as BlobPart], { type: 'application/pdf' }));
  logger.debug('[LabelPDF] PDF generated successfully');
  return url;
}

// --- ENTERPRISE INVOICE GENERATOR (DESIGN A) ---
