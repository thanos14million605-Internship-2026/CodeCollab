const PDFDocument = require("pdfkit");

const generateCodePDF = (code, language) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(16).text(`Code (${language})`, { underline: true });
    doc.moveDown();

    doc.font("Courier").fontSize(10).text(code, {
      lineGap: 2,
    });

    doc.end();
  });
};

module.exports = generateCodePDF;
