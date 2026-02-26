import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ShipmentWithRelations } from '@/hooks/useShipments';
import { InvoiceWithRelations } from '@/hooks/useInvoices';
import { formatCurrency } from '@/lib/utils';

interface ReportData {
  shipments: ShipmentWithRelations[];
  invoices: InvoiceWithRelations[];
  inventoryCount: number;
}

export const generateDashboardReport = (data: ReportData) => {
  const doc = new jsPDF();
  const today = format(new Date(), 'dd MMM yyyy HH:mm');

  // --- Header ---
  doc.setFontSize(20);
  doc.setTextColor(43, 45, 131); // TAC Navy #2B2D83
  doc.text('TAC Cargo', 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Mission Control Report', 14, 28);
  doc.text(`Generated: ${today}`, 150, 22, { align: 'right' });

  doc.setLineWidth(0.5);
  doc.setDrawColor(200);
  doc.line(14, 32, 196, 32);

  // --- KPI Summary ---
  const active = data.shipments.filter((s) =>
    ['RECEIVED_AT_ORIGIN', 'IN_TRANSIT', 'RECEIVED_AT_DEST'].includes(s.status)
  ).length;
  const exceptions = data.shipments.filter((s) => s.status === 'EXCEPTION').length;
  const delivered = data.shipments.filter((s) => s.status === 'DELIVERED').length;
  const total = data.shipments.length;

  let yPos = 45;
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Performance Overview', 14, yPos);

  yPos += 10;

  // KPI Cards (Simple Boxes)
  const cardWidth = 40;
  const cardHeight = 25;

  const drawCard = (x: number, label: string, value: number, color: [number, number, number]) => {
    doc.setFillColor(...color);
    doc.rect(x, yPos, cardWidth, cardHeight, 'F');
    doc.setTextColor(255);
    doc.setFontSize(16);
    doc.text(value.toString(), x + cardWidth / 2, yPos + 12, { align: 'center' });
    doc.setFontSize(8);
    doc.text(label, x + cardWidth / 2, yPos + 20, { align: 'center' });
  };

  drawCard(14, 'Total Shipments', total, [43, 45, 131]); // Navy
  drawCard(60, 'Active Transit', active, [45, 107, 255]); // Blue
  drawCard(106, 'Delivered', delivered, [34, 197, 94]); // Green
  drawCard(152, 'Exceptions', exceptions, [239, 68, 68]); // Red

  // --- Financial Snapshot ---
  yPos += 40;
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.text('Financial Snapshot', 14, yPos);

  const totalRevenue = data.invoices.reduce((acc, inv) => acc + inv.total, 0);
  const pendingRevenue = data.invoices
    .filter((i) => ['ISSUED', 'OVERDUE'].includes(i.status))
    .reduce((acc, inv) => acc + inv.total, 0);

  yPos += 10;
  doc.setFontSize(10);
  doc.text(`Total Invoiced: ${formatCurrency(totalRevenue)}`, 14, yPos);
  doc.text(`Pending Collections: ${formatCurrency(pendingRevenue)}`, 80, yPos);
  doc.text(`Inventory On-Hand: ${data.inventoryCount} Pkgs`, 150, yPos);

  // --- Recent Shipments Table ---
  yPos += 15;
  doc.setFontSize(14);
  doc.text('Recent Shipments', 14, yPos);

  const tableRows = data.shipments
    .slice(0, 15)
    .map((s) => [
      s.cn_number,
      format(new Date(s.created_at), 'dd MMM'),
      s.origin_hub?.code || 'UNK',
      s.destination_hub?.code || 'UNK',
      s.status.replace(/_/g, ' '),
      s.service_level,
    ]);

  autoTable(doc, {
    startY: yPos + 5,
    head: [['CN Number', 'Date', 'Origin', 'Dest', 'Status', 'Service']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [43, 45, 131] },
    styles: { fontSize: 8 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount} - TAC Cargo Confidential`, 105, 290, {
      align: 'center',
    });
  }

  doc.save(`TAC-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
