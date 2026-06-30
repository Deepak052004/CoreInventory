import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Helper to draw a standard header
const drawHeader = (doc, title, documentNumber, date, settings) => {
  const companyName = settings?.companyName || "CoreInventory";
  const companyAddressLines = (settings?.companyAddress || "123 Warehouse Lane, Logistics City, CA 90210").split('\n');
  const companyPhone = settings?.companyPhone || "+1 (555) 123-4567";

  let startY = 22;

  // Render logo if base64 is provided
  if (settings?.logoBase64) {
    try {
      // Assuming it's a square-ish or wide logo. Let's make it 30x30 or fit.
      // In a real app we'd get dimensions, but for now fixed width of 30
      doc.addImage(settings.logoBase64, 'JPEG', 14, 10, 30, 20);
      startY = 35; // push text down
    } catch (e) {
      console.warn("Failed to add image to PDF", e);
    }
  }

  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59);
  doc.text(companyName, 14, startY);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  
  let currentY = startY + 6;
  companyAddressLines.forEach(line => {
    doc.text(line, 14, currentY);
    currentY += 5;
  });
  doc.text(companyPhone, 14, currentY);
  
  // Right side block
  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text(title, 196, 22, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`${documentNumber}`, 196, 28, { align: 'right' });
  if (date) {
    doc.text(`Date: ${new Date(date).toLocaleDateString()}`, 196, 33, { align: 'right' });
  }
  
  // Line separator
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(14, currentY + 7, 196, currentY + 7);
  return currentY + 17; // Return new startY for content
};

export const generatePO = (po, settings) => {
  const doc = new jsPDF();
  const currency = settings?.currencySymbol || '$';
  
  const contentY = drawHeader(doc, "PURCHASE ORDER", po.poNumber, po.createdAt, settings);
  
  // Supplier Details
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text("Vendor:", 14, contentY);
  
  doc.setFontSize(11);
  doc.text(po.supplier?.name || 'N/A', 14, contentY + 7);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Email: ${po.supplier?.email || 'N/A'}`, 14, contentY + 13);
  doc.text(`Expected Date: ${new Date(po.expectedDate).toLocaleDateString()}`, 14, contentY + 19);
  doc.text(`Target Warehouse: ${po.warehouse?.name || 'N/A'}`, 14, contentY + 25);

  // Items Table
  const tableColumn = ["Item", "SKU", "Qty", "Unit Cost", "Total"];
  const tableRows = [];
  
  let grandTotal = 0;
  
  po.items.forEach(item => {
    const total = item.quantity * item.unitCost;
    grandTotal += total;
    tableRows.push([
      item.product?.name || 'N/A',
      item.product?.SKU || 'N/A',
      item.quantity,
      `${currency}${item.unitCost.toFixed(2)}`,
      `${currency}${total.toFixed(2)}`
    ]);
  });
  
  doc.autoTable({
    startY: contentY + 35,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    foot: [['', '', '', 'Total:', `${currency}${grandTotal.toFixed(2)}`]],
    footStyles: { fillColor: [248, 250, 252], textColor: [30, 41, 59], fontStyle: 'bold' }
  });
  
  doc.save(`${po.poNumber}.pdf`);
};

export const generateInvoice = (so, settings) => {
  const doc = new jsPDF();
  const currency = settings?.currencySymbol || '$';
  
  const contentY = drawHeader(doc, "INVOICE", so.soNumber, so.createdAt, settings);
  
  // Customer Details
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text("Bill To:", 14, contentY);
  
  doc.setFontSize(11);
  doc.text(so.customer?.name || 'N/A', 14, contentY + 7);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Email: ${so.customer?.email || 'N/A'}`, 14, contentY + 13);
  
  // Items Table
  const tableColumn = ["Item", "SKU", "Qty", "Unit Price", "Total"];
  const tableRows = [];
  
  let grandTotal = 0;
  
  so.items.forEach(item => {
    const total = item.quantity * item.unitPrice;
    grandTotal += total;
    tableRows.push([
      item.product?.name || 'N/A',
      item.product?.SKU || 'N/A',
      item.quantity,
      `${currency}${item.unitPrice.toFixed(2)}`,
      `${currency}${total.toFixed(2)}`
    ]);
  });
  
  doc.autoTable({
    startY: contentY + 25,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59] },
    foot: [['', '', '', 'Total Due:', `${currency}${grandTotal.toFixed(2)}`]],
    footStyles: { fillColor: [248, 250, 252], textColor: [30, 41, 59], fontStyle: 'bold' }
  });
  
  doc.save(`Invoice_${so.soNumber}.pdf`);
};

export const generatePackingSlip = (so, settings) => {
  const doc = new jsPDF();
  
  const contentY = drawHeader(doc, "PACKING SLIP", so.soNumber, new Date().toISOString(), settings);
  
  // Customer Details
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text("Ship To:", 14, contentY);
  
  doc.setFontSize(11);
  doc.text(so.customer?.name || 'N/A', 14, contentY + 7);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Source Warehouse: ${so.warehouse?.name || 'N/A'}`, 14, contentY + 13);
  
  // Items Table (NO PRICES)
  const tableColumn = ["Item", "SKU", "Quantity Ordered", "Quantity Shipped", "Backordered"];
  const tableRows = [];
  
  so.items.forEach(item => {
    const backordered = Math.max(0, item.quantity - (item.deliveredQty || 0));
    tableRows.push([
      item.product?.name || 'N/A',
      item.product?.SKU || 'N/A',
      item.quantity,
      item.deliveredQty || 0,
      backordered > 0 ? backordered : '0'
    ]);
  });
  
  doc.autoTable({
    startY: contentY + 25,
    head: [tableColumn],
    body: tableRows,
    theme: 'plain',
    headStyles: { fillColor: [226, 232, 240], textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });
  
  doc.save(`PackingSlip_${so.soNumber}.pdf`);
};
