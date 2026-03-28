import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';

interface CertificateData {
  fullName: string;
  courseTitle: string;
  certificateNumber: string;
  issuedDate: Date;
}

// Load fonts and images via Buffer at module level (once, not per PDF)
let fontMain: Buffer | null = null;
let fontBold: Buffer | null = null;
let stampImage: Buffer | null = null;
let signatureImage: Buffer | null = null;
let assetsLoaded = false;

function loadAssets(): void {
  if (assetsLoaded) return;
  assetsLoaded = true;

  const candidates = [
    path.join(__dirname, '../assets'),
    path.join(__dirname, '../../src/assets'),
    path.resolve('src/assets'),
    path.resolve('apps/api/src/assets'),
    path.resolve('apps/api/dist/assets'),
  ];

  for (const dir of candidates) {
    const regularPath = path.join(dir, 'fonts', 'Roboto-Regular.ttf');
    const boldPath = path.join(dir, 'fonts', 'Roboto-Bold.ttf');
    if (fs.existsSync(regularPath) && fs.existsSync(boldPath)) {
      fontMain = fs.readFileSync(regularPath);
      fontBold = fs.readFileSync(boldPath);
      console.log(`[Certificate] Fonts loaded from: ${dir}/fonts`);

      // Load stamp and signature images
      const stampPath = path.join(dir, 'images', 'stamp.png');
      const sigPath = path.join(dir, 'images', 'signature.png');
      if (fs.existsSync(stampPath)) {
        stampImage = fs.readFileSync(stampPath);
        console.log(`[Certificate] Stamp loaded`);
      }
      if (fs.existsSync(sigPath)) {
        signatureImage = fs.readFileSync(sigPath);
        console.log(`[Certificate] Signature loaded`);
      }
      return;
    }
  }

  console.warn('[Certificate] Roboto fonts not found, falling back to Helvetica');
}

loadAssets();

export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  // Generate QR code as PNG buffer
  const verifyUrl = `https://demo-lms.aibot.kz/certificates/verify/${data.certificateNumber}`;
  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    type: 'png',
    width: 160,
    margin: 1,
    color: { dark: '#1a3a6c', light: '#FAFBFC' },
  });

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

    // Register fonts with Cyrillic support
    const hasCustomFonts = !!(fontMain && fontBold);
    if (hasCustomFonts) {
      doc.registerFont('Main', fontMain!);
      doc.registerFont('Bold', fontBold!);
    }

    const setFont = (bold: boolean) => {
      if (hasCustomFonts) {
        doc.font(bold ? 'Bold' : 'Main');
      } else {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
      }
    };

    // === COLORS (AiBot brand: orange accent) ===
    const BRAND = '#F97316';      // orange-500
    const BRAND_DARK = '#EA580C'; // orange-600
    const DARK = '#1E293B';       // slate-800
    const GRAY = '#64748B';       // slate-500
    const LIGHT_GRAY = '#94A3B8'; // slate-400
    const BG = '#FAFBFC';
    const STAMP_BLUE = '#1a3a6c'; // dark blue for stamp

    // === BACKGROUND ===
    doc.rect(0, 0, W, H).fill(BG);

    // === DECORATIVE DIAGONAL CORNERS (like Kogio) ===
    // Top-left triangle
    doc.save();
    doc.moveTo(0, 0).lineTo(120, 0).lineTo(0, 120).closePath().fill(BRAND);
    doc.restore();

    // Bottom-right triangle
    doc.save();
    doc.moveTo(W, H).lineTo(W - 120, H).lineTo(W, H - 120).closePath().fill(BRAND);
    doc.restore();

    // === SUBTLE BORDER ===
    const m = 40;
    doc.lineWidth(0.5).rect(m, m, W - m * 2, H - m * 2).stroke('#E2E8F0');

    // === INNER DECORATIVE BORDER (double line) ===
    const m2 = 50;
    doc.lineWidth(1.5).rect(m2, m2, W - m2 * 2, H - m2 * 2).stroke(BRAND);
    const m3 = 54;
    doc.lineWidth(0.5).rect(m3, m3, W - m3 * 2, H - m3 * 2).stroke('#E2E8F0');

    // === LOGO ===
    setFont(true);
    doc.fontSize(28)
       .fillColor(BRAND)
       .text('AiBot', 0, 80, { align: 'center', width: W });

    // Small tagline
    setFont(false);
    doc.fontSize(9)
       .fillColor(LIGHT_GRAY)
       .text('ОБРАЗОВАТЕЛЬНАЯ ПЛАТФОРМА', 0, 112, { align: 'center', width: W, characterSpacing: 3 });

    // === TITLE ===
    setFont(true);
    doc.fontSize(44)
       .fillColor(BRAND)
       .text('СЕРТИФИКАТ', 0, 145, { align: 'center', width: W });

    // === DECORATIVE LINE ===
    const lineY = 200;
    doc.moveTo(W / 2 - 80, lineY).lineTo(W / 2 + 80, lineY).lineWidth(2).stroke(BRAND);

    // === SUBTITLE ===
    setFont(false);
    doc.fontSize(12)
       .fillColor(GRAY)
       .text('НАСТОЯЩИЙ СЕРТИФИКАТ ПОДТВЕРЖДАЕТ, ЧТО', 0, 218, { align: 'center', width: W, characterSpacing: 1.5 });

    // === NAME ===
    setFont(true);
    doc.fontSize(32)
       .fillColor(DARK)
       .text(data.fullName, 0, 250, { align: 'center', width: W });

    // === COURSE LINE ===
    setFont(false);
    doc.fontSize(12)
       .fillColor(GRAY)
       .text('ПРОШЁЛ КУРС', 0, 300, { align: 'center', width: W, characterSpacing: 1.5 });

    // === COURSE TITLE ===
    setFont(true);
    doc.fontSize(20)
       .fillColor(DARK)
       .text(`«${data.courseTitle}»`, 0, 325, { align: 'center', width: W });

    // === PLATFORM TEXT ===
    setFont(false);
    doc.fontSize(10)
       .fillColor(LIGHT_GRAY)
       .text('на образовательной платформе AiBot', 0, 355, { align: 'center', width: W });

    // === BOTTOM SECTION ===
    const bottomY = 415;

    // Left — Date
    setFont(false);
    doc.fontSize(10)
       .fillColor(GRAY)
       .text('Дата выдачи:', 120, bottomY, { width: 150 });

    const dateStr = data.issuedDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    setFont(true);
    doc.fontSize(11)
       .fillColor(DARK)
       .text(dateStr, 120, bottomY + 16, { width: 200 });

    // === LEFT — Company Stamp (PNG image, below date) ===
    if (stampImage) {
      doc.image(stampImage, 130, bottomY + 38, { width: 90, height: 58 });
    } else {
      const stampCx = 175;
      const stampCy = bottomY + 65;
      doc.circle(stampCx, stampCy, 25).lineWidth(1.5).stroke(STAMP_BLUE);
      doc.circle(stampCx, stampCy, 20).lineWidth(0.8).stroke(STAMP_BLUE);
      setFont(true);
      doc.fontSize(7).fillColor(STAMP_BLUE)
         .text('AiBot', stampCx - 18, stampCy - 5, { width: 36, align: 'center' });
    }

    // === RIGHT — Director + Signature ===
    const sigX = W - 280;
    setFont(true);
    doc.fontSize(11)
       .fillColor(DARK)
       .text('АСЫЛБЕКОВ Е.Т.', sigX, bottomY, { width: 160 });

    setFont(false);
    doc.fontSize(9)
       .fillColor(GRAY)
       .text('Генеральный директор', sigX, bottomY + 16, { width: 160 });

    // Signature image
    if (signatureImage) {
      doc.image(signatureImage, sigX + 15, bottomY + 30, { width: 110, height: 40 });
    } else {
      doc.moveTo(sigX, bottomY + 38).lineTo(sigX + 140, bottomY + 38).lineWidth(0.5).stroke('#CBD5E1');
    }

    // === QR CODE (centered, above bottom border) ===
    const qrSize = 65;
    const cx = W / 2;
    doc.image(qrBuffer, cx - qrSize / 2, H - 100, { width: qrSize, height: qrSize });

    doc.end();
  });
}
