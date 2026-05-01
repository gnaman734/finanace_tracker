import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export const exportTransactionsToExcel = async (transactions) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Transactions');
  sheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Amount', key: 'amount', width: 14 },
    { header: 'Note', key: 'note', width: 36 }
  ];
  transactions.forEach((tx) => sheet.addRow(tx));
  return workbook.xlsx.writeBuffer();
};

export const exportTransactionsToPDF = (transactions) => {
  const doc = new PDFDocument({ margin: 32 });
  doc.fontSize(18).text('Transactions Report');
  doc.moveDown();
  transactions.forEach((tx) => {
    doc.fontSize(11).text(`${tx.date} | ${tx.type} | ${tx.amount} | ${tx.note || ''}`);
  });
  doc.end();
  return doc;
};
