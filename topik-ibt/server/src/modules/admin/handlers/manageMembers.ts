import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import ExcelJS from 'exceljs';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

const SALT_ROUNDS = 12;

/**
 * GET /api/admin/members
 * 회원(RegistrationUser) 목록 조회
 */
export async function listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = (req.query.search as string) || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [members, total] = await Promise.all([
      prisma.registrationUser.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          isVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.registrationUser.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        members,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/members
 * 회원 단건 추가
 */
export async function createMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      throw new AppError(400, '이름, 이메일, 비밀번호는 필수입니다');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      const member = await prisma.registrationUser.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash,
          name: name.trim(),
          phone: phone || null,
          isVerified: true, // 관리자 생성 시 인증 완료
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          isVerified: true,
          createdAt: true,
        },
      });

      res.status(201).json({ success: true, data: member });
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new AppError(409, '이미 등록된 이메일입니다');
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/members/bulk-import
 * 회원 엑셀 임포트
 * Excel 컬럼: 이름/name, 이메일/email, 비밀번호/password, 전화번호/phone (선택)
 */
export async function bulkImportMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      throw new AppError(400, 'Excel 파일을 업로드해주세요');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as any);
    const sheet = workbook.worksheets[0];

    if (!sheet || sheet.rowCount < 2) {
      throw new AppError(400, 'Excel 파일에 데이터가 없습니다 (헤더 + 최소 1행 필요)');
    }

    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = String(cell.value || '').trim().toLowerCase();
    });

    interface MemberRow {
      name: string;
      email: string;
      password: string;
      phone?: string;
    }

    const rows: MemberRow[] = [];
    const errors: string[] = [];

    for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
      const row = sheet.getRow(rowNum);
      const getValue = (key: string): string => {
        const colIdx = headers.indexOf(key);
        if (colIdx === -1) return '';
        const val = row.getCell(colIdx).value;
        return val != null ? String(val).trim() : '';
      };

      const name = getValue('name') || getValue('이름') || getValue('성명');
      const email = getValue('email') || getValue('이메일');
      const password = getValue('password') || getValue('비밀번호');
      const phone = getValue('phone') || getValue('전화번호') || getValue('연락처');

      if (!name && !email) continue;

      if (!name) { errors.push(`${rowNum}행: 이름 누락`); continue; }
      if (!email) { errors.push(`${rowNum}행: 이메일 누락`); continue; }
      if (!password) { errors.push(`${rowNum}행: 비밀번호 누락`); continue; }

      rows.push({ name, email: email.toLowerCase().trim(), password, phone: phone || undefined });
    }

    if (rows.length === 0) {
      throw new AppError(400, `유효한 데이터가 없습니다. ${errors.length > 0 ? '오류: ' + errors.join('; ') : ''}`);
    }

    const hashedRows = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        passwordHash: await bcrypt.hash(row.password, SALT_ROUNDS),
      })),
    );

    let created = 0;
    let skipped = 0;
    const skippedDetails: string[] = [];

    for (const row of hashedRows) {
      try {
        await prisma.registrationUser.create({
          data: {
            email: row.email,
            passwordHash: row.passwordHash,
            name: row.name,
            phone: row.phone || null,
            isVerified: true,
          },
        });
        created++;
      } catch (err: any) {
        if (err.code === 'P2002') {
          skipped++;
          skippedDetails.push(`${row.email} (중복)`);
        } else {
          skipped++;
          skippedDetails.push(`${row.email} (${err.message})`);
        }
      }
    }

    res.json({
      success: true,
      data: { totalRows: rows.length, created, skipped, skippedDetails, parseErrors: errors },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/members/:id
 * 회원 삭제 (Registration이 있으면 거부)
 */
export async function deleteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    const registrations = await prisma.registration.findFirst({
      where: { userId: id },
      select: { id: true },
    });

    if (registrations) {
      throw new AppError(400, '접수 이력이 있는 회원은 삭제할 수 없습니다');
    }

    await prisma.registrationUser.delete({ where: { id } });

    res.json({ success: true, message: '회원이 삭제되었습니다' });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return next(new AppError(404, '회원을 찾을 수 없습니다'));
    }
    next(err);
  }
}
