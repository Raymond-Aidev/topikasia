/**
 * POST /api/admin/examinees/bulk-import
 * Excel 파일로 응시자 일괄 등록 (ADMIN-08)
 *
 * Excel 컬럼: loginId, password, name, registrationNumber, seatNumber, institutionName, examRoomName
 */
import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import ExcelJS from 'exceljs';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

const SALT_ROUNDS = 12;

interface ExamineeRow {
  loginId: string;
  password: string;
  name: string;
  registrationNumber: string;
  seatNumber?: number;
  institutionName?: string;
  examRoomName?: string;
}

export async function bulkImportExaminees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      throw new AppError(400, 'Excel 파일을 업로드해주세요');
    }

    const { assignedExamSetId } = req.body;

    // 시험세트 확인
    if (assignedExamSetId) {
      const examSet = await prisma.examSet.findUnique({
        where: { id: assignedExamSetId },
        select: { status: true },
      });
      if (!examSet) throw new AppError(404, '시험세트를 찾을 수 없습니다');
      if (examSet.status !== 'ACTIVE') throw new AppError(400, 'ACTIVE 상태의 시험세트만 배정 가능합니다');
    }

    // Excel 파싱
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as any);
    const sheet = workbook.worksheets[0];

    if (!sheet || sheet.rowCount < 2) {
      throw new AppError(400, 'Excel 파일에 데이터가 없습니다 (헤더 + 최소 1행 필요)');
    }

    // 헤더 파싱
    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = String(cell.value || '').trim().toLowerCase();
    });

    const rows: ExamineeRow[] = [];
    const errors: string[] = [];

    for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
      const row = sheet.getRow(rowNum);
      const getValue = (key: string): string => {
        const colIdx = headers.indexOf(key);
        if (colIdx === -1) return '';
        const val = row.getCell(colIdx).value;
        return val != null ? String(val).trim() : '';
      };

      const loginId = getValue('loginid') || getValue('login_id') || getValue('아이디');
      const password = getValue('password') || getValue('비밀번호');
      const name = getValue('name') || getValue('이름') || getValue('성명');
      const registrationNumber = getValue('registrationnumber') || getValue('registration_number') || getValue('수험번호');
      const seatNumberStr = getValue('seatnumber') || getValue('seat_number') || getValue('좌석번호');
      const institutionName = getValue('institutionname') || getValue('institution_name') || getValue('기관명') || getValue('시험센터');
      const examRoomName = getValue('examroomname') || getValue('exam_room_name') || getValue('고사장');

      // 빈 행 스킵
      if (!loginId && !name) continue;

      // 유효성 검사
      if (!loginId) { errors.push(`${rowNum}행: loginId 누락`); continue; }
      if (!password) { errors.push(`${rowNum}행: password 누락`); continue; }
      if (!name) { errors.push(`${rowNum}행: name 누락`); continue; }
      if (!registrationNumber) { errors.push(`${rowNum}행: registrationNumber 누락`); continue; }

      rows.push({
        loginId,
        password,
        name,
        registrationNumber,
        seatNumber: seatNumberStr ? Number(seatNumberStr) : undefined,
        institutionName: institutionName || undefined,
        examRoomName: examRoomName || undefined,
      });
    }

    if (rows.length === 0) {
      throw new AppError(400, `유효한 데이터가 없습니다. ${errors.length > 0 ? '오류: ' + errors.join('; ') : ''}`);
    }

    // 비밀번호 해싱
    const hashedRows = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        passwordHash: await bcrypt.hash(row.password, SALT_ROUNDS),
      })),
    );

    // 일괄 생성
    let created = 0;
    let skipped = 0;
    const skippedDetails: string[] = [];

    for (const row of hashedRows) {
      try {
        await prisma.examinee.create({
          data: {
            loginId: row.loginId,
            passwordHash: row.passwordHash,
            name: row.name,
            registrationNumber: row.registrationNumber,
            seatNumber: row.seatNumber ?? null,
            institutionName: row.institutionName ?? null,
            examRoomName: row.examRoomName ?? null,
            assignedExamSetId: assignedExamSetId || null,
            createdById: req.admin!.sub,
          },
        });
        created++;
      } catch (err: any) {
        if (err.code === 'P2002') {
          skipped++;
          skippedDetails.push(`${row.loginId} (중복)`);
        } else {
          skipped++;
          skippedDetails.push(`${row.loginId} (${err.message})`);
        }
      }
    }

    // 감사 로그
    await prisma.auditLog.create({
      data: {
        action: 'BULK_IMPORT_EXAMINEES',
        targetType: 'Examinee',
        targetId: 'batch',
        detail: {
          fileName: file.originalname,
          totalRows: rows.length,
          created,
          skipped,
          skippedDetails: skippedDetails.slice(0, 20),
          adminId: req.admin!.sub,
        },
      },
    });

    res.json({
      success: true,
      data: {
        totalRows: rows.length,
        created,
        skipped,
        skippedDetails,
        parseErrors: errors,
      },
    });
  } catch (err) {
    next(err);
  }
}
