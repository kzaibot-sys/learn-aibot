import PDFDocument from 'pdfkit';
import path from 'path';

interface CertificateData {
  fullName: string;
  courseTitle: string;
  certificateNumber: string;
  issuedDate: Date;
}

export function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 0,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = 842; // A4 landscape width
    const H = 595; // A4 landscape height

    const fontDir = path.join(__dirname, '../assets/fonts');
    doc.registerFont('Roboto', path.join(fontDir, 'Roboto-Regular.ttf'));
    doc.registerFont('Roboto-Bold', path.join(fontDir, 'Roboto-Bold.ttf'));

    // Background
    doc.rect(0, 0, W, H).fill('#FAFBFC');

    // Outer border (gold)
    const borderMargin = 25;
    doc.lineWidth(3)
       .rect(borderMargin, borderMargin, W - borderMargin * 2, H - borderMargin * 2)
       .stroke('#C8A951');

    // Inner border (blue)
    const innerMargin = 35;
    doc.lineWidth(1)
       .rect(innerMargin, innerMargin, W - innerMargin * 2, H - innerMargin * 2)
       .stroke('#1A3B6D');

    // Decorative corner accents
    const cornerSize = 30;
    const corners = [
      [innerMargin, innerMargin],
      [W - innerMargin - cornerSize, innerMargin],
      [innerMargin, H - innerMargin - cornerSize],
      [W - innerMargin - cornerSize, H - innerMargin - cornerSize],
    ];
    corners.forEach(([x, y]) => {
      doc.rect(x, y, cornerSize, cornerSize).fill('#C8A951');
      doc.rect(x + 3, y + 3, cornerSize - 6, cornerSize - 6).fill('#FAFBFC');
    });

    // Logo
    doc.font('Roboto-Bold')
       .fontSize(18)
       .fillColor('#1A3B6D')
       .text('AiBot', 0, 70, { align: 'center', width: W });

    // Decorative line
    const lineY = 100;
    doc.moveTo(W / 2 - 100, lineY).lineTo(W / 2 + 100, lineY).lineWidth(2).stroke('#C8A951');

    // Title
    doc.font('Roboto-Bold')
       .fontSize(42)
       .fillColor('#1A3B6D')
       .text('СЕРТИФИКАТ', 0, 125, { align: 'center', width: W });

    // Subtitle
    doc.font('Roboto')
       .fontSize(14)
       .fillColor('#4A5568')
       .text('Настоящим подтверждается, что', 0, 185, { align: 'center', width: W });

    // Name
    doc.font('Roboto-Bold')
       .fontSize(30)
       .fillColor('#1A3B6D')
       .text(data.fullName, 0, 215, { align: 'center', width: W });

    // Course text
    doc.font('Roboto')
       .fontSize(14)
       .fillColor('#4A5568')
       .text('успешно завершил(а) курс', 0, 265, { align: 'center', width: W });

    // Course title
    doc.font('Roboto-Bold')
       .fontSize(22)
       .fillColor('#C8A951')
       .text(`"${data.courseTitle}"`, 0, 290, { align: 'center', width: W });

    // Platform text
    doc.font('Roboto')
       .fontSize(12)
       .fillColor('#4A5568')
       .text('на образовательной платформе AiBot', 0, 325, { align: 'center', width: W });

    // Date
    const dateStr = data.issuedDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    doc.font('Roboto')
       .fontSize(11)
       .fillColor('#718096')
       .text(`Дата выдачи: ${dateStr}`, 0, 360, { align: 'center', width: W });

    // Certificate number
    doc.font('Roboto')
       .fontSize(10)
       .fillColor('#A0AEC0')
       .text(`${data.certificateNumber}`, 0, 380, { align: 'center', width: W });

    // Bottom section — signatures
    const bottomY = 440;

    // Left — Company seal
    const sealX = 200;
    doc.circle(sealX, bottomY + 25, 35).lineWidth(2).stroke('#1A3B6D');
    doc.circle(sealX, bottomY + 25, 30).lineWidth(1).stroke('#1A3B6D');
    doc.font('Roboto-Bold').fontSize(7).fillColor('#1A3B6D');
    doc.text('ТОО', sealX - 10, bottomY + 12, { width: 20, align: 'center' });
    doc.text('AiBot', sealX - 15, bottomY + 22, { width: 30, align: 'center' });

    doc.font('Roboto')
       .fontSize(10)
       .fillColor('#4A5568')
       .text('Печать организации', sealX - 50, bottomY + 70, { width: 100, align: 'center' });

    // Right — Director signature
    const sigX = W - 250;
    doc.moveTo(sigX, bottomY + 45).lineTo(sigX + 120, bottomY + 45).lineWidth(1).stroke('#4A5568');
    doc.font('Roboto')
       .fontSize(10)
       .fillColor('#4A5568')
       .text('Директор', sigX, bottomY + 50, { width: 120, align: 'center' });
    doc.font('Roboto-Bold')
       .fontSize(10)
       .fillColor('#1A3B6D')
       .text('Асылбеков Е.Т.', sigX, bottomY + 65, { width: 120, align: 'center' });

    // Decorative bottom line
    doc.moveTo(W / 2 - 150, H - 55).lineTo(W / 2 + 150, H - 55).lineWidth(1).stroke('#C8A951');

    doc.font('Roboto')
       .fontSize(8)
       .fillColor('#A0AEC0')
       .text('Проверить подлинность: aibot.kz/certificates/verify/' + data.certificateNumber, 0, H - 50, { align: 'center', width: W });

    doc.end();
  });
}
