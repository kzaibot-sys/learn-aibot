import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

interface CertificateData {
  fullName: string;
  courseTitle: string;
  certificateNumber: string;
  issuedDate: Date;
}

function findFontsDir(): string {
  // Try multiple paths: src (dev) and relative to dist (prod/Docker)
  const candidates = [
    path.join(__dirname, '../assets/fonts'),        // from dist/services/ -> dist/assets/fonts
    path.join(__dirname, '../../src/assets/fonts'),  // from dist/services/ -> src/assets/fonts
    path.resolve('src/assets/fonts'),                // from CWD (apps/api/)
    path.resolve('apps/api/src/assets/fonts'),       // from monorepo root
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'Roboto-Regular.ttf'))) {
      return dir;
    }
  }
  return '';
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

    // Register fonts with Cyrillic support
    const fontsDir = findFontsDir();
    if (fontsDir) {
      doc.registerFont('Main', path.join(fontsDir, 'Roboto-Regular.ttf'));
      doc.registerFont('Bold', path.join(fontsDir, 'Roboto-Bold.ttf'));
    } else {
      // Fallback — Helvetica doesn't support Cyrillic well, but at least won't crash
      doc.registerFont('Main', 'Helvetica');
      doc.registerFont('Bold', 'Helvetica-Bold');
    }

    // === COLORS (AiBot brand: orange accent) ===
    const BRAND = '#F97316';      // orange-500
    const BRAND_DARK = '#EA580C'; // orange-600
    const DARK = '#1E293B';       // slate-800
    const GRAY = '#64748B';       // slate-500
    const LIGHT_GRAY = '#94A3B8'; // slate-400
    const BG = '#FAFBFC';

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
    doc.font('Bold')
       .fontSize(28)
       .fillColor(BRAND)
       .text('AiBot', 0, 80, { align: 'center', width: W });

    // Small tagline
    doc.font('Main')
       .fontSize(9)
       .fillColor(LIGHT_GRAY)
       .text('ОБРАЗОВАТЕЛЬНАЯ ПЛАТФОРМА', 0, 112, { align: 'center', width: W, characterSpacing: 3 });

    // === TITLE ===
    doc.font('Bold')
       .fontSize(44)
       .fillColor(BRAND)
       .text('СЕРТИФИКАТ', 0, 145, { align: 'center', width: W });

    // === DECORATIVE LINE ===
    const lineY = 200;
    doc.moveTo(W / 2 - 80, lineY).lineTo(W / 2 + 80, lineY).lineWidth(2).stroke(BRAND);

    // === SUBTITLE ===
    doc.font('Main')
       .fontSize(12)
       .fillColor(GRAY)
       .text('НАСТОЯЩИЙ СЕРТИФИКАТ ПОДТВЕРЖДАЕТ, ЧТО', 0, 218, { align: 'center', width: W, characterSpacing: 1.5 });

    // === NAME ===
    doc.font('Bold')
       .fontSize(32)
       .fillColor(DARK)
       .text(data.fullName, 0, 250, { align: 'center', width: W });

    // === COURSE LINE ===
    doc.font('Main')
       .fontSize(12)
       .fillColor(GRAY)
       .text('ПРОШЁЛ КУРС', 0, 300, { align: 'center', width: W, characterSpacing: 1.5 });

    // === COURSE TITLE ===
    doc.font('Bold')
       .fontSize(20)
       .fillColor(DARK)
       .text(`«${data.courseTitle}»`, 0, 325, { align: 'center', width: W });

    // === PLATFORM TEXT ===
    doc.font('Main')
       .fontSize(10)
       .fillColor(LIGHT_GRAY)
       .text('на образовательной платформе AiBot', 0, 355, { align: 'center', width: W });

    // === BOTTOM SECTION ===
    const bottomY = 420;

    // Left — Date
    doc.font('Main')
       .fontSize(10)
       .fillColor(GRAY)
       .text('Дата выдачи:', 120, bottomY, { width: 150 });

    const dateStr = data.issuedDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    doc.font('Bold')
       .fontSize(11)
       .fillColor(DARK)
       .text(dateStr, 120, bottomY + 16, { width: 200 });

    // Center — Logo seal (circle with "A" icon)
    const cx = W / 2;
    const cy = bottomY + 20;
    doc.circle(cx, cy, 28).lineWidth(2.5).stroke(BRAND);
    doc.circle(cx, cy, 22).lineWidth(1).stroke(BRAND);
    doc.font('Bold').fontSize(20).fillColor(BRAND);
    doc.text('A', cx - 10, cy - 10, { width: 20, align: 'center' });

    doc.font('Main')
       .fontSize(8)
       .fillColor(GRAY)
       .text('ТОО «AiBot»', cx - 40, cy + 35, { width: 80, align: 'center' });

    // Right — Director
    const sigX = W - 280;
    doc.font('Bold')
       .fontSize(11)
       .fillColor(DARK)
       .text('АСЫЛБЕКОВ Е.Т.', sigX, bottomY, { width: 160 });

    doc.font('Main')
       .fontSize(9)
       .fillColor(GRAY)
       .text('Генеральный директор', sigX, bottomY + 16, { width: 160 });

    // Signature line
    doc.moveTo(sigX, bottomY + 40).lineTo(sigX + 130, bottomY + 40).lineWidth(0.5).stroke('#CBD5E1');

    // === CERTIFICATE NUMBER ===
    doc.font('Main')
       .fontSize(8)
       .fillColor(LIGHT_GRAY)
       .text(data.certificateNumber, 0, H - 70, { align: 'center', width: W });

    // === VERIFICATION URL ===
    doc.font('Main')
       .fontSize(7)
       .fillColor(LIGHT_GRAY)
       .text('Проверить подлинность: aibot.kz/certificates/verify/' + data.certificateNumber, 0, H - 58, { align: 'center', width: W });

    doc.end();
  });
}
