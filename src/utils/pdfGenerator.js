const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
exports.invoicePDF = async (invoice) => {
  const dir = path.join(__dirname, "../../uploads/invoices");
  fs.mkdirSync(dir, { recursive: true });
  const file = `${invoice.invoiceNo}.pdf`;
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(fs.createWriteStream(path.join(dir, file)));
  doc.fontSize(18).text("Sales Invoice", { align: "center" });
  doc.moveDown();
  doc.fontSize(11).text(`Invoice: ${invoice.invoiceNo}`);
  doc.text(`Grand Total: ${invoice.grandTotal}`);
  doc.end();
  return `/uploads/invoices/${file}`;
};
