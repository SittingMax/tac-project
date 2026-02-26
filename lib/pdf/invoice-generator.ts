import { PDFDocument, StandardFonts, Color } from 'pdf-lib';
import { C, pdfDate, safeCurrency } from './pdf-utils';
import { Invoice } from '../../types';
import { BANK_DETAILS } from '../../config/constants';

type ExtendedInvoice = Invoice & {
  line_items?: { awb?: string };
  consignee?: { address?: string; city?: string };
  contentsDescription?: string;
  totalWeight?: { chargeable?: number };
  totalPackageCount?: number;
};

export async function generateEnterpriseInvoice(invoice: Invoice): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  // A4 Size
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  // Fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

  // --- 1. PREMIUM HEADER (Navy Block) ---
  const headerHeight = 220;
  const headerY = height - headerHeight;

  // Background
  page.drawRectangle({ x: 0, y: headerY, width, height: headerHeight, color: C.NAVY });

  // Pattern Overlay (Dotted Grid)
  for (let i = 20; i < width; i += 20) {
    for (let j = headerY + 10; j < height; j += 20) {
      page.drawCircle({ x: i, y: j, size: 0.8, color: C.WHITE, opacity: 0.1 });
    }
  }

  const margin = 40;

  // LOGO BLOCK (Top Left)
  const logoY = height - 50;
  page.drawRectangle({ x: margin, y: logoY - 20, width: 24, height: 24, color: C.WHITE });
  page.drawText('W', { x: margin + 6, y: logoY - 14, size: 14, font: fontBold, color: C.NAVY });

  // Brand Name
  page.drawText('TAC', { x: margin + 34, y: logoY - 8, size: 16, font: fontBold, color: C.WHITE });
  page.drawText('EXPRESS LOGISTICS', {
    x: margin + 34,
    y: logoY - 18,
    size: 6,
    font: fontBold,
    color: C.WHITE,
    opacity: 0.8,
  });

  // INVOICE TITLE & ORDER #
  const titleY = logoY - 60;
  page.drawText('INVOICE', { x: margin, y: titleY, size: 36, font: fontBold, color: C.WHITE });
  page.drawText(`ORDER #: ${invoice.invoiceNumber}`, {
    x: margin,
    y: titleY - 18,
    size: 10,
    font: fontMono,
    color: C.WHITE,
    opacity: 0.8,
  });

  // CN Number (below ORDER #)
  const awbNumber = invoice.awb || (invoice as ExtendedInvoice).line_items?.awb || '';
  if (awbNumber) {
    page.drawText(`CN: ${awbNumber}`, {
      x: margin,
      y: titleY - 32,
      size: 10,
      font: fontMono,
      color: C.WHITE,
      opacity: 0.8,
    });
  }

  // ADDRESS BLOCKS (Grid Layout)
  const addrY = titleY - 70;
  const colWidth = 180;

  // Label Style
  const drawLabel = (text: string, x: number, y: number) =>
    page.drawText(text, { x, y, size: 7, font: fontBold, color: C.WHITE, opacity: 0.6 });

  // Value Style
  const drawVal = (text: string, x: number, y: number, size = 9, opacity = 1) =>
    page.drawText(text, { x, y, size, font: fontRegular, color: C.WHITE, opacity });

  const drawValBold = (text: string, x: number, y: number) =>
    page.drawText(text, { x, y, size: 9, font: fontBold, color: C.WHITE });

  // Payment To (Left)
  drawLabel('PAYMENT TO:', margin, addrY);
  drawValBold('TAC HQ', margin, addrY - 12);
  drawVal('1498, Kotla Mubarakpur', margin, addrY - 24);
  drawVal('New Delhi - 110003', margin, addrY - 36, 9, 0.8);

  // Bill To (Right of Payment)
  const billToX = margin + colWidth;
  drawLabel('BILL TO:', billToX, addrY);
  drawValBold(invoice.customerName || 'Walk-in Customer', billToX, addrY - 12);
  const custAddr = (invoice as ExtendedInvoice).consignee?.address || 'Standard Delivery Address';
  drawVal(custAddr.substring(0, 30), billToX, addrY - 24);
  const custCity = (invoice as ExtendedInvoice).consignee?.city || '';
  if (custCity) drawVal(custCity, billToX, addrY - 36, 9, 0.8);

  // --- 2. HEADER ILLUSTRATION (Open Box SVG) ---
  // Moving UP substantially to top-right corner.
  const illX = width - 140;
  const illY = height - 95; // Adjusted to move it up (higher Y = higher on page)
  const scale = 1.3; // Adjusted scale to fit comfortably

  // Helper: Draw Path
  const drawPath = (path: string, color: Color) => {
    page.drawSvgPath(path, { x: illX, y: illY, scale, color, opacity: 1 });
  };

  // New "Open Box" Paths
  // 1. Right Side Face
  drawPath('M45,12H57V55a4,4,0,0,1-4,4H44Z', C.ILL_ORANGE_1);
  // 2. Top/Back Flaps & Left Structure
  drawPath(
    'M13 12H57l1.459-6.566A2 2 0 0 0 56.507 3H45.36zM3 12H47a0 0 0 0 1 0 0V55a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V12A0 0 0 0 1 3 12z',
    C.ILL_ORANGE_2
  );
  // 3. Inner Top Flap
  drawPath('M47,12H3L1.033,3.358A2,2,0,0,1,3,1h40.33A2,2,0,0,1,45.3,2.642Z', C.ILL_ORANGE_3);
  // 4. Box Contents / Shadow Details (Brown)
  drawPath(
    'M28 45a1 1 0 0 0-1 1v8a1 1 0 0 0 2 0V46A1 1 0 0 0 28 45zM40 45a1 1 0 0 0-1 1v8a1 1 0 0 0 2 0V46A1 1 0 0 0 40 45zM32 45a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V46A1 1 0 0 0 32 45zM36 45a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V46A1 1 0 0 0 36 45zM20 53H8a1 1 0 0 0 0 2H20a1 1 0 0 0 0-2zM8.707 45.707L9 45.414V50a1 1 0 0 0 2 0V45.414l.293.293a1 1 0 0 0 1.414-1.414l-2-2c-.009-.009-.021-.012-.03-.02a1 1 0 0 0-.294-.2h0c-.008 0-.017 0-.025-.006a.966.966 0 0 0-.319-.062c-.032 0-.062 0-.094 0a.992.992 0 0 0-.258.051c-.031.01-.061.019-.091.032a.983.983 0 0 0-.3.2l-2 2a1 1 0 1 0 1.414 1.414zM18.707 42.293c-.009-.009-.021-.012-.03-.02a1 1 0 0 0-.294-.2h0c-.008 0-.017 0-.025-.006a.982.982 0 0 0-.319-.062c-.032 0-.062 0-.094 0a.985.985 0 0 0-.257.051.907.907 0 0 0-.092.032.983.983 0 0 0-.3.2l-2 2a1 1 0 0 0 1.414 1.414L17 45.414V50a1 1 0 0 0 2 0V45.414l.293.293a1 1 0 0 0 1.414-1.414z',
    C.ILL_BROWN
  );
  // 5. Left Bottom Corner
  drawPath('M10,59H7a4,4,0,0,1-4-4V12H6V55A4,4,0,0,0,10,59Z', C.ILL_ORANGE_1);
  // 6. Left Top Flap Edge
  drawPath('M4.03,3.36,6,12H3L1.03,3.36A2,2,0,0,1,3,1H6A2,2,0,0,0,4.03,3.36Z', C.ILL_ORANGE_2);
  // 7. Top Right Flap (Polygon converted to Path)
  drawPath('M50,12 L47,12 L45.37,3 L48.37,3 L50,12 Z', C.ILL_ORANGE_1);
  // 8. Right Vertical Edge/Depth
  drawPath('M50,12V55a4,4,0,0,1-4,4H43a4,4,0,0,0,4-4V12Z', C.ILL_ORANGE_4);

  // --- 3. METADATA STRIP ---
  const metaY = headerY - 40;
  // Label Icon (Small rounded rect)
  page.drawRectangle({ x: margin, y: metaY, width: 10, height: 10, color: C.NAVY, opacity: 0.1 });
  page.drawText('INVOICE DATE:', {
    x: margin + 16,
    y: metaY + 2,
    size: 8,
    font: fontBold,
    color: C.MUTED,
  });

  // AWB in metadata strip (center)
  if (awbNumber) {
    const awbMetaLabel = `CN: ${awbNumber}`;
    const awbMetaWidth = fontBold.widthOfTextAtSize(awbMetaLabel, 9);
    page.drawText(awbMetaLabel, {
      x: (width - awbMetaWidth) / 2,
      y: metaY + 2,
      size: 9,
      font: fontBold,
      color: C.INK,
    });
  }

  page.drawText(pdfDate(invoice.createdAt), {
    x: width - margin - 100,
    y: metaY + 2,
    size: 10,
    font: fontBold,
    color: C.INK,
  });

  // --- 4. PROFESSIONAL TABLE ---
  const tableTop = metaY - 40;

  // Table Header Background
  page.drawRectangle({
    x: margin,
    y: tableTop,
    width: width - margin * 2,
    height: 32,
    color: C.NAVY,
  });

  const thY = tableTop + 10;
  const col1 = margin + 16;
  const col2 = width - 220; // Qty - positioned for balance
  const col3 = width - 160; // Price - positioned to avoid overlap
  const col4 = width - margin - 10; // Total (Anchor Right) - right-aligned

  const drawTh = (text: string, x: number, align = 'left') => {
    const txtWidth = fontBold.widthOfTextAtSize(text, 8);
    const xPos = align === 'right' ? x - txtWidth : x;
    page.drawText(text, { x: xPos, y: thY, size: 8, font: fontBold, color: C.WHITE });
  };

  drawTh('DESCRIPTION', col1);
  drawTh('QTY', col2);
  drawTh('PRICE', col3);
  drawTh('TOTAL', col4, 'right');

  // Table Rows
  let y = tableTop; // Start below header

  const drawRow = (desc: string, qty: string, price: string, total: string) => {
    y -= 40; // Row Height

    // Row Separator
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 0.5,
      color: C.BORDER,
    });

    const txtY = y + 14;
    page.drawText(desc, { x: col1, y: txtY, size: 9, font: fontRegular, color: C.INK });
    page.drawText(qty, { x: col2 + 5, y: txtY, size: 9, font: fontMono, color: C.INK });
    // Right-align price
    const priceW = fontMono.widthOfTextAtSize(price, 9);
    page.drawText(price, { x: col3 + 50 - priceW, y: txtY, size: 9, font: fontMono, color: C.INK });

    // Right-align total
    const totW = fontBold.widthOfTextAtSize(total, 9);
    page.drawText(total, { x: col4 - totW, y: txtY, size: 9, font: fontBold, color: C.INK });
  };

  // Item 1
  const itemDesc = (invoice as ExtendedInvoice).contentsDescription || 'General Cargo';
  const weight = (invoice as ExtendedInvoice).totalWeight?.chargeable || 1;
  drawRow(
    `${itemDesc} (${weight} kg)`,
    String((invoice as ExtendedInvoice).totalPackageCount || 1),
    safeCurrency(invoice.financials.ratePerKg),
    safeCurrency(invoice.financials.baseFreight)
  );

  // Item 2 (Surcharges if any)
  const surcharges =
    invoice.financials.fuelSurcharge +
    invoice.financials.docketCharge +
    invoice.financials.handlingFee;
  if (surcharges > 0) {
    drawRow(
      'Surcharges (Fuel, Docket, Handling)',
      '1',
      safeCurrency(surcharges),
      safeCurrency(surcharges)
    );
  }

  // Item 3 (Services)
  const services =
    invoice.financials.pickupCharge +
    invoice.financials.packingCharge +
    invoice.financials.insurance;
  if (services > 0) {
    drawRow('Value Added Services', '1', safeCurrency(services), safeCurrency(services));
  }

  // --- 5. TOTALS CARD (Right Aligned) ---
  y -= 30; // Spacing after table

  // Card Background (Optional, or just whitespace)
  // We align values to the right - adjusted for better spacing
  const totalsLabelX = width - 200;
  const totalsValX = width - margin - 10;

  const drawTotalRow = (label: string, value: string, isBold = false) => {
    y -= 20;
    page.drawText(label, { x: totalsLabelX, y, size: 9, font: fontRegular, color: C.MUTED });
    const w = (isBold ? fontBold : fontMono).widthOfTextAtSize(value, isBold ? 12 : 9);
    page.drawText(value, {
      x: totalsValX - w,
      y,
      size: isBold ? 12 : 9,
      font: isBold ? fontBold : fontMono,
      color: isBold ? C.NAVY : C.INK,
    });
  };

  // Subtotal — compute from components for accuracy
  const subtotal =
    (invoice.financials.baseFreight || 0) +
    (invoice.financials.docketCharge || 0) +
    (invoice.financials.pickupCharge || 0) +
    (invoice.financials.packingCharge || 0) +
    (invoice.financials.fuelSurcharge || 0) +
    (invoice.financials.handlingFee || 0) +
    (invoice.financials.insurance || 0) -
    (invoice.financials.discount || 0);
  drawTotalRow('Subtotal', safeCurrency(subtotal));

  // Tax
  drawTotalRow('Tax (18%)', safeCurrency(invoice.financials.tax.total));

  // Divider
  y -= 10;
  page.drawLine({
    start: { x: totalsLabelX, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: C.BORDER,
  });
  y -= 10;

  // Grand Total
  const totalStr = safeCurrency(invoice.financials.totalAmount);
  // Dynamic font size based on amount length to prevent overflow
  const grandTotalFontSize = totalStr.length > 14 ? 12 : totalStr.length > 11 ? 14 : 16;
  const gtw = fontBold.widthOfTextAtSize(totalStr, grandTotalFontSize);
  y -= 10;
  page.drawText('Grand Total', { x: totalsLabelX, y, size: 10, font: fontBold, color: C.NAVY });
  page.drawText(totalStr, {
    x: totalsValX - gtw,
    y,
    size: grandTotalFontSize,
    font: fontBold,
    color: C.NAVY,
  });

  // --- 6. TERMS & CONDITIONS (Bottom Panel) ---
  const termsHeight = 120;
  const termsY = 160; // Fixed position near bottom

  // Background Panel
  page.drawRectangle({ x: 0, y: termsY, width, height: termsHeight, color: C.PANEL });
  page.drawLine({
    start: { x: 0, y: termsY + termsHeight },
    end: { x: width, y: termsY + termsHeight },
    thickness: 1,
    color: C.BORDER,
  });

  const tContentY = termsY + termsHeight - 25;
  page.drawText('TERMS & CONDITIONS OF CARRIAGE - TAC', {
    x: margin,
    y: tContentY,
    size: 8,
    font: fontBold,
    color: C.NAVY,
    opacity: 0.8,
  });

  const col2Start = margin + 260;
  const termSize = 6;
  const tY = tContentY - 15;

  const termsL = [
    'DECLARATION: Consignor warrants accurate declaration of contents.',
    'LIABILITY: Limited to conditions of carriage. Claims must be filed within 30 days.',
    'JURISDICTION: Governed by Indian law. Disputes referred to arbitration.',
  ];
  const termsR = [
    'PROHIBITED: Illegal or hazardous items strictly prohibited.',
    "FRAGILE: Carried at owner's risk unless special insurance purchased.",
    'UNCLAIMED: Goods unclaimed after 45 days may be disposed.',
  ];

  const drawTerms = (lines: string[], x: number) => {
    let ly = tY;
    lines.forEach((l) => {
      const parts = l.split(':');
      if (parts.length > 1) {
        const label = parts[0] + ':';
        const content = parts[1];
        page.drawText(label, { x, y: ly, size: termSize, font: fontBold, color: C.INK });
        const lw = fontBold.widthOfTextAtSize(label, termSize);
        page.drawText(content, {
          x: x + lw + 2,
          y: ly,
          size: termSize,
          font: fontRegular,
          color: C.MUTED,
        });
      } else {
        page.drawText(l, { x, y: ly, size: termSize, font: fontRegular, color: C.MUTED });
      }
      ly -= 12;
    });
  };

  drawTerms(termsL, margin);
  drawTerms(termsR, col2Start);

  // --- 7. FOOTER (Bottom) ---
  const footerY = 80;

  // Left: Payment Info
  page.drawText('PAYMENT INFO:', { x: margin, y: footerY, size: 7, font: fontBold, color: C.NAVY });
  page.drawText(`Bank: ${BANK_DETAILS.bankName}`, {
    x: margin,
    y: footerY - 12,
    size: 8,
    font: fontRegular,
    color: C.INK,
  });
  page.drawText(`Acct: ${BANK_DETAILS.accountName}`, {
    x: margin,
    y: footerY - 24,
    size: 8,
    font: fontRegular,
    color: C.INK,
  });
  page.drawText(`No: ${BANK_DETAILS.accountNumber}`, {
    x: margin,
    y: footerY - 36,
    size: 8,
    font: fontRegular,
    color: C.INK,
  });

  // Right: Contact Info
  // Align Right logic
  const drawRightFooter = (text: string, y: number, bold = false) => {
    const w = (bold ? fontBold : fontRegular).widthOfTextAtSize(text, bold ? 7 : 8);
    page.drawText(text, {
      x: width - margin - w,
      y,
      size: bold ? 7 : 8,
      font: bold ? fontBold : fontRegular,
      color: bold ? C.NAVY : C.INK,
    });
  };

  drawRightFooter('CONTACT', footerY, true);
  drawRightFooter('+91 999 888 7777', footerY - 12);
  drawRightFooter('billing@tapancargo.com', footerY - 24);
  drawRightFooter('www.tapancargo.com', footerY - 36);

  // Bottom Branding Line
  page.drawLine({
    start: { x: margin, y: 30 },
    end: { x: width - margin, y: 30 },
    thickness: 4,
    color: C.NAVY,
  });

  const pdfBytes = await pdfDoc.save();
  return URL.createObjectURL(new Blob([pdfBytes as BlobPart], { type: 'application/pdf' }));
}
