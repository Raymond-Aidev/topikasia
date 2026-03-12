/**
 * POST /api/exam/score/email
 * SCORE-06: 성적표 이메일 발송
 */
import type { Request, Response, NextFunction } from 'express';
import nodemailer from 'nodemailer';
import { prisma } from '../../../config/database';
import { env } from '../../../config/env';
import { AppError } from '../../../shared/types';

const SECTION_LABELS: Record<string, string> = {
  LISTENING: '듣기',
  WRITING: '쓰기',
  READING: '읽기',
};

const GRADE_LABELS: Record<number, string> = {
  1: '1급', 2: '2급', 3: '3급', 4: '4급', 5: '5급', 6: '6급',
};

export async function sendScoreEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.examinee) {
      throw new AppError(401, '인증이 필요합니다');
    }

    // SMTP 설정 확인
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
      throw new AppError(503, '이메일 서비스가 설정되지 않았습니다');
    }

    const { email } = req.body as { email: string };
    if (!email || typeof email !== 'string') {
      throw new AppError(400, '이메일 주소를 입력해주세요');
    }

    const examineeId = req.examinee.sub;

    // 응시자 정보 조회
    const examinee = await prisma.examinee.findUnique({
      where: { id: examineeId },
      select: { name: true },
    });

    if (!examinee) {
      throw new AppError(404, '응시자를 찾을 수 없습니다');
    }

    // 공개된 성적 조회
    const scores = await prisma.score.findMany({
      where: {
        examineeId,
        isPublished: true,
      },
      include: {
        examSet: { select: { name: true, examType: true } },
        session: { select: { startedAt: true, completedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (scores.length === 0) {
      throw new AppError(404, '공개된 성적이 없습니다');
    }

    // HTML 이메일 본문 생성
    const scoreHtmlParts = scores.map((s) => {
      const sectionScores = s.sectionScores as Record<string, any>;

      const sectionRows = Object.entries(sectionScores)
        .map(([section, data]) => `
          <tr>
            <td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:14px;">${SECTION_LABELS[section] || section}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:center;font-size:16px;font-weight:700;color:#1565C0;">${data.raw}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:center;font-size:14px;color:#9ca3af;">${data.maxScore}</td>
          </tr>`)
        .join('');

      const gradeText = s.grade ? GRADE_LABELS[s.grade] || `${s.grade}급` : '미달';
      const examDate = s.session.startedAt
        ? new Date(s.session.startedAt).toLocaleDateString('ko-KR')
        : '-';

      return `
        <div style="margin-bottom:24px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <div style="background:#1565C0;color:#fff;padding:24px 28px;text-align:center;">
            <div style="font-size:13px;opacity:0.8;margin-bottom:4px;">한국어능력시험</div>
            <div style="font-size:22px;font-weight:800;">TOPIK 성적표</div>
            <div style="font-size:12px;margin-top:6px;opacity:0.7;">Test of Proficiency in Korean</div>
          </div>
          <div style="padding:20px 28px;border-bottom:1px solid #eee;">
            <table style="width:100%;font-size:14px;">
              <tr>
                <td style="color:#6b7280;padding:4px 0;">응시자</td>
                <td style="font-weight:600;">${examinee.name}</td>
                <td style="color:#6b7280;padding:4px 0;">시험유형</td>
                <td style="font-weight:600;">${s.examSet.examType === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'}</td>
              </tr>
              <tr>
                <td style="color:#6b7280;padding:4px 0;">시험명</td>
                <td style="font-weight:600;">${s.examSet.name}</td>
                <td style="color:#6b7280;padding:4px 0;">시험일</td>
                <td style="font-weight:600;">${examDate}</td>
              </tr>
            </table>
          </div>
          <div style="padding:20px 28px;">
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr>
                  <th style="padding:10px 14px;text-align:left;font-size:13px;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;">영역</th>
                  <th style="padding:10px 14px;text-align:center;font-size:13px;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;">점수</th>
                  <th style="padding:10px 14px;text-align:center;font-size:13px;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;">만점</th>
                </tr>
              </thead>
              <tbody>
                ${sectionRows}
              </tbody>
            </table>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding:14px 18px;background:#f0f4f8;border-radius:10px;">
              <div>
                <div style="font-size:12px;color:#6b7280;">총점</div>
                <div style="font-size:24px;font-weight:800;color:#111827;">${s.totalScore}<span style="font-size:14px;font-weight:400;color:#9ca3af;">/${s.maxTotalScore}</span></div>
              </div>
              <div style="text-align:center;">
                <div style="font-size:12px;color:#6b7280;">등급</div>
                <div style="font-size:26px;font-weight:800;color:${s.grade ? '#1565C0' : '#d1d5db'};">${gradeText}</div>
              </div>
            </div>
          </div>
        </div>`;
    });

    const htmlBody = `
      <div style="max-width:600px;margin:0 auto;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;background:#f0f4f8;padding:32px 16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-size:18px;font-weight:700;color:#1565C0;">TOPIK IBT 성적표</div>
          <div style="font-size:13px;color:#6b7280;margin-top:4px;">${examinee.name}님의 성적표입니다</div>
        </div>
        ${scoreHtmlParts.join('')}
        <div style="text-align:center;font-size:12px;color:#9ca3af;margin-top:24px;">
          본 이메일은 TOPIK Asia 시스템에서 자동 발송되었습니다.
        </div>
      </div>`;

    // 이메일 발송
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: `[TOPIK] ${examinee.name}님의 성적표`,
      html: htmlBody,
    });

    res.json({ success: true, message: '성적표가 이메일로 발송되었습니다' });
  } catch (err) {
    next(err);
  }
}
