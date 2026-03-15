import { Request, Response, NextFunction } from 'express';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

const FONTS_DIR = path.join(__dirname, '..', '..', '..', '..', 'assets', 'fonts');

/** Font registry: name → file path */
const FONT_FILES: Record<string, string> = {
  NotoSans: 'NotoSans-Regular.ttf',
  NotoSansBold: 'NotoSans-Bold.ttf',
  NotoSansKR: 'NotoSansKR-Regular.ttf',
  NotoSansKRBold: 'NotoSansKR-Bold.ttf',
  NotoSansThai: 'NotoSansThai-Regular.ttf',
  NotoSansKhmer: 'NotoSansKhmer-Regular.ttf',
  NotoSansMyanmar: 'NotoSansMyanmar-Regular.ttf',
  NotoSansLao: 'NotoSansLao-Regular.ttf',
};

/** Unicode range → font name mapping (order matters: check specific scripts first) */
const SCRIPT_RANGES: Array<{ test: (code: number) => boolean; font: string; bold: string }> = [
  // Korean (Hangul Syllables + Jamo + Compatibility Jamo)
  { test: (c) => (c >= 0xAC00 && c <= 0xD7AF) || (c >= 0x1100 && c <= 0x11FF) || (c >= 0x3130 && c <= 0x318F),
    font: 'NotoSansKR', bold: 'NotoSansKRBold' },
  // CJK Unified Ideographs + Radicals + Extensions
  { test: (c) => (c >= 0x4E00 && c <= 0x9FFF) || (c >= 0x3400 && c <= 0x4DBF) || (c >= 0x2E80 && c <= 0x2FDF),
    font: 'NotoSansKR', bold: 'NotoSansKRBold' },
  // Hiragana + Katakana
  { test: (c) => (c >= 0x3040 && c <= 0x30FF) || (c >= 0x31F0 && c <= 0x31FF),
    font: 'NotoSansKR', bold: 'NotoSansKRBold' },
  // Thai
  { test: (c) => c >= 0x0E01 && c <= 0x0E7F,
    font: 'NotoSansThai', bold: 'NotoSansThai' },
  // Lao
  { test: (c) => c >= 0x0E80 && c <= 0x0EFF,
    font: 'NotoSansLao', bold: 'NotoSansLao' },
  // Khmer
  { test: (c) => (c >= 0x1780 && c <= 0x17FF) || (c >= 0x19E0 && c <= 0x19FF),
    font: 'NotoSansKhmer', bold: 'NotoSansKhmer' },
  // Myanmar
  { test: (c) => (c >= 0x1000 && c <= 0x109F) || (c >= 0xAA60 && c <= 0xAA7F),
    font: 'NotoSansMyanmar', bold: 'NotoSansMyanmar' },
  // Cyrillic (Uzbek, Kazakh, etc.)
  { test: (c) => c >= 0x0400 && c <= 0x04FF,
    font: 'NotoSans', bold: 'NotoSansBold' },
];

/**
 * Detect the best font for a given text string based on Unicode ranges.
 * Returns the first non-Latin script detected; defaults to NotoSans (Latin).
 */
function detectFont(text: string): { font: string; bold: string } {
  for (let i = 0; i < text.length; i++) {
    const code = text.codePointAt(i)!;
    if (code > 0xFFFF) i++; // skip surrogate pair
    if (code < 0x0080) continue; // ASCII — skip
    for (const range of SCRIPT_RANGES) {
      if (range.test(code)) return { font: range.font, bold: range.bold };
    }
  }
  return { font: 'NotoSans', bold: 'NotoSansBold' };
}

/**
 * Register all available Noto Sans fonts with the PDF document.
 * Returns true if at least the base NotoSans font is available.
 */
function registerFonts(doc: PDFKit.PDFDocument): boolean {
  let hasBase = false;
  for (const [name, file] of Object.entries(FONT_FILES)) {
    const fullPath = path.join(FONTS_DIR, file);
    if (fs.existsSync(fullPath)) {
      doc.registerFont(name, fullPath);
      if (name === 'NotoSans') hasBase = true;
    }
  }
  return hasBase;
}

/**
 * GET /api/registration/my/:id/ticket
 * 수험표 PDF 다운로드
 */
export async function downloadTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.registrationUser!.sub;
    const id = req.params.id as string;

    // Registration + ExamSchedule JOIN
    const rows = await prisma.$queryRaw`
      SELECT r."id", r."userId", r."examType", r."englishName", r."birthDate",
             r."gender", r."venueId", r."venueName", r."status",
             r."examineeId", r."createdAt",
             s."examName", s."examRound", s."examDate",
             s."registrationStartAt", s."registrationEndAt"
      FROM "Registration" r
      JOIN "ExamSchedule" s ON r."scheduleId" = s."id"
      WHERE r."id" = ${id}
      LIMIT 1
    ` as any[];

    if (rows.length === 0) {
      throw new AppError(404, '접수 내역을 찾을 수 없습니다');
    }

    const reg = rows[0];

    if (reg.userId !== userId) {
      throw new AppError(403, '접근 권한이 없습니다');
    }

    if (reg.status !== 'APPROVED' && reg.status !== 'CONFIRMED') {
      throw new AppError(400, '승인된 접수만 수험표를 다운로드할 수 있습니다');
    }

    // 수험번호 조회 (Examinee에서)
    let registrationNumber = reg.id.slice(0, 8).toUpperCase();
    if (reg.examineeId) {
      const examinees = await prisma.$queryRaw`
        SELECT "registrationNumber" FROM "Examinee" WHERE "id" = ${reg.examineeId} LIMIT 1
      ` as any[];
      if (examinees.length > 0 && examinees[0].registrationNumber) {
        registrationNumber = examinees[0].registrationNumber;
      }
    }

    // 생년월일 포맷
    const birthDate = reg.birthDate instanceof Date
      ? reg.birthDate.toISOString().split('T')[0]
      : String(reg.birthDate).split('T')[0];

    // 시험일 포맷
    const examDate = reg.examDate instanceof Date
      ? reg.examDate.toISOString().split('T')[0]
      : String(reg.examDate).split('T')[0];

    // PDF 생성
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ticket_${registrationNumber}.pdf"`);

    doc.pipe(res);

    // 다국어 폰트 등록
    const hasFonts = registerFonts(doc);

    // Detect best font for dynamic text fields
    const examNameFont = hasFonts ? detectFont(reg.examName || '') : { font: 'Helvetica', bold: 'Helvetica-Bold' };
    const venueFont = hasFonts ? detectFont(reg.venueName || '') : { font: 'Helvetica', bold: 'Helvetica-Bold' };
    const nameFont = hasFonts ? detectFont(reg.englishName || '') : { font: 'Helvetica', bold: 'Helvetica-Bold' };

    // Base fonts for labels and static text
    const baseFont = hasFonts ? 'NotoSans' : 'Helvetica';
    const baseBoldFont = hasFonts ? 'NotoSansBold' : 'Helvetica-Bold';

    // ── 헤더 ──
    const pageWidth = doc.page.width - 100; // margin 50 * 2
    doc.rect(50, 50, pageWidth, 60).fill('#1565C0');
    doc.fill('#FFFFFF').font(baseBoldFont).fontSize(24)
      .text('TOPIK', 70, 65, { continued: true })
      .fontSize(14).text('  IBT', { continued: false });
    doc.fill('#FFFFFF').font(baseFont).fontSize(12)
      .text('Test of Proficiency in Korean', 70, 90);

    // ── 타이틀 ──
    doc.moveDown(2);
    doc.fill('#212121').font(baseBoldFont).fontSize(22)
      .text('Admission Ticket', { align: 'center' });
    doc.font(baseFont).fontSize(12).fill('#757575')
      .text('Examinee Admission Card', { align: 'center' });

    doc.moveDown(1.5);

    // ── 수험 정보 테이블 ──
    const startY = doc.y;
    const labelX = 70;
    const valueX = 220;
    const rowHeight = 32;
    let currentY = startY;

    // 테이블 배경
    doc.rect(50, startY - 10, pageWidth, rowHeight * 8 + 20).stroke('#E0E0E0');

    const drawRow = (label: string, value: string, y: number, valueFont?: string) => {
      // 라벨 배경
      doc.rect(50, y - 4, 160, rowHeight).fill('#F5F5F5');
      doc.fill('#616161').font(baseBoldFont).fontSize(11).text(label, labelX, y + 2);
      doc.fill('#212121').font(valueFont || baseFont).fontSize(12).text(value, valueX, y + 1);
    };

    drawRow('Registration No.', registrationNumber, currentY);
    currentY += rowHeight;
    drawRow('Exam', reg.examName || '-', currentY, examNameFont.font);
    currentY += rowHeight;
    drawRow('Exam Type', reg.examType === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II', currentY);
    currentY += rowHeight;
    drawRow('Exam Date', examDate, currentY);
    currentY += rowHeight;
    drawRow('Name (EN)', reg.englishName || '-', currentY, nameFont.font);
    currentY += rowHeight;
    drawRow('Date of Birth', birthDate, currentY);
    currentY += rowHeight;
    drawRow('Gender', reg.gender === 'MALE' ? 'Male' : 'Female', currentY);
    currentY += rowHeight;
    drawRow('Test Center', reg.venueName || '-', currentY, venueFont.font);

    // ── 하단 안내 ──
    doc.moveDown(4);
    doc.y = currentY + rowHeight + 30;
    doc.rect(50, doc.y - 10, pageWidth, 80).fill('#FFF8E1').stroke('#FFE082');
    const noticeY = doc.y;
    doc.fill('#F57F17').font(baseBoldFont).fontSize(10)
      .text('NOTICE', 70, noticeY);
    doc.fill('#795548').font(baseFont).fontSize(9)
      .text('1. Please bring this admission ticket and a valid photo ID on the exam day.', 70, noticeY + 16)
      .text('2. Arrive at the test center at least 30 minutes before the exam starts.', 70, noticeY + 30)
      .text('3. Electronic devices (mobile phones, smartwatches, etc.) are not allowed.', 70, noticeY + 44);

    // ── 푸터 ──
    doc.moveDown(3);
    doc.fill('#BDBDBD').font(baseFont).fontSize(8)
      .text(`Issued: ${new Date().toISOString().split('T')[0]}`, 50, doc.page.height - 80, { align: 'center', width: pageWidth });
    doc.text('TOPIK Asia IBT - www.topikasia.com', 50, doc.page.height - 65, { align: 'center', width: pageWidth });

    doc.end();
  } catch (err) {
    next(err);
  }
}
