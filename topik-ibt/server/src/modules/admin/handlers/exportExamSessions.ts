import { Request, Response, NextFunction } from 'express';
import ExcelJS from 'exceljs';
import { prisma } from '../../../config/database';

/**
 * GET /api/admin/exam-sessions/export
 * 시험 세션 데이터 Excel 내보내기
 */
export async function exportExamSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const examSetId = req.query.examSetId as string | undefined;
    const status = req.query.status as string | undefined;

    const where: any = {};
    if (examSetId) where.examSetId = examSetId;
    if (status) where.status = status;

    const sessions = await prisma.examSession.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        status: true,
        sectionProgressJson: true,
        startedAt: true,
        completedAt: true,
        examinee: {
          select: {
            registrationNumber: true,
            name: true,
            seatNumber: true,
          },
        },
        examSet: {
          select: {
            name: true,
            examSetNumber: true,
          },
        },
        answers: {
          select: {
            section: true,
            submittedAt: true,
            isAutoSubmitted: true,
          },
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TOPIK IBT Admin';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('시험 세션');

    sheet.columns = [
      { header: '수험번호', key: 'registrationNumber', width: 18 },
      { header: '성명', key: 'name', width: 15 },
      { header: '좌석번호', key: 'seatNumber', width: 10 },
      { header: '시험세트', key: 'examSet', width: 20 },
      { header: '응시상태', key: 'status', width: 12 },
      { header: '시험시작', key: 'startedAt', width: 22 },
      { header: '듣기제출', key: 'listeningSubmittedAt', width: 22 },
      { header: '쓰기제출', key: 'writingSubmittedAt', width: 22 },
      { header: '읽기제출', key: 'readingSubmittedAt', width: 22 },
      { header: '시험완료', key: 'completedAt', width: 22 },
      { header: '자동제출여부', key: 'isAutoSubmitted', width: 14 },
    ];

    // 헤더 스타일
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const statusLabel: Record<string, string> = {
      IN_PROGRESS: '진행중',
      COMPLETED: '완료',
      ABANDONED: '포기',
    };

    for (const session of sessions) {
      const answers = session.answers || [];

      const getSubmittedAt = (section: string) => {
        const answer = answers.find((a: any) => a.section === section && a.submittedAt);
        return answer?.submittedAt ? formatDate(answer.submittedAt) : '';
      };

      const hasAutoSubmitted = answers.some((a: any) => a.isAutoSubmitted);

      sheet.addRow({
        registrationNumber: session.examinee.registrationNumber,
        name: session.examinee.name,
        seatNumber: session.examinee.seatNumber ?? '',
        examSet: `${session.examSet.examSetNumber} - ${session.examSet.name}`,
        status: statusLabel[session.status] || session.status,
        startedAt: formatDate(session.startedAt),
        listeningSubmittedAt: getSubmittedAt('listening'),
        writingSubmittedAt: getSubmittedAt('writing'),
        readingSubmittedAt: getSubmittedAt('reading'),
        completedAt: session.completedAt ? formatDate(session.completedAt) : '',
        isAutoSubmitted: hasAutoSubmitted ? 'Y' : 'N',
      });
    }

    const filename = `exam-sessions-${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
