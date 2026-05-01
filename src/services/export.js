import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export const buildExcelReport = async (transactions) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Transactions');
  sheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Note', key: 'note', width: 30 }
  ];
  transactions.forEach((t) => sheet.addRow(t));
  return workbook.xlsx.writeBuffer();
};

export const buildPdfReport = (transactions) => {
  const doc = new PDFDocument({ margin: 30 });
  doc.fontSize(16).text('Transaction Report', { underline: true });
  doc.moveDown();
  transactions.forEach((t) => {
    doc.fontSize(11).text(`${t.date} | ${t.type} | ${t.amount} | ${t.note ?? ''}`);
  });
  doc.end();
  return doc;
};
