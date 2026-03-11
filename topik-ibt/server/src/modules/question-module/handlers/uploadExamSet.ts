import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';
import { assertStatusTransition } from '../../../shared/utils/examSetStatus';
import { fetchQuestionDetail, QuestionBankDetail } from '../questionBankClient';

interface SectionJson {
  sectionCode: string;
  sectionName: string;
  timeLimitMinutes: number;
  questions: SectionQuestion[];
}

interface SectionQuestion {
  bankId: string;
  questionIndex: number;
  points?: number;
}

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationWarning {
  field: string;
  message: string;
}

/**
 * POST /api/question-module/exam-sets/:id/upload
 * 시험세트 업로드 (DRAFT → UPLOADED 상태 전이)
 *
 * ACID T1-05: updateMany WHERE status='DRAFT' 를 사용한 원자적 상태 전이
 * ACID T2-03: 상태 전이 유효성 검증
 */
export async function uploadExamSet(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.admin) {
      throw new AppError(401, '관리자 인증이 필요합니다');
    }

    const id = req.params.id as string;

    // 현재 시험세트 조회
    const examSet = await prisma.examSet.findUnique({ where: { id } });

    if (!examSet) {
      throw new AppError(404, '시험세트를 찾을 수 없습니다');
    }

    // ACID T2-03: 상태 전이 유효성 검증
    assertStatusTransition(examSet.status, 'UPLOADED');

    // sectionsJson 검증
    const sections = examSet.sectionsJson as unknown as SectionJson[];

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      errors.push({
        field: 'sectionsJson',
        message: '시험세트에 섹션이 없습니다. 최소 하나의 섹션이 필요합니다',
      });
    }

    if (errors.length > 0) {
      res.status(422).json({
        success: false,
        errors,
        warnings,
      });
      return;
    }

    // 각 섹션 검증 및 스냅샷 생성
    const snapshotSections: Array<SectionJson & { questionsSnapshot: QuestionBankDetail[] }> = [];

    for (const section of sections) {
      if (!section.questions || section.questions.length === 0) {
        errors.push({
          field: `sections.${section.sectionCode}`,
          message: `${section.sectionName} 섹션에 문제가 없습니다`,
        });
        continue;
      }

      // 듣기 섹션 오디오 검증
      if (section.sectionCode === 'LISTENING' || section.sectionCode === 'listening') {
        const questionsSnapshot: QuestionBankDetail[] = [];

        for (const q of section.questions) {
          try {
            const detail = await fetchQuestionDetail(q.bankId);
            questionsSnapshot.push(detail);

            if (!detail.audioUrl) {
              warnings.push({
                field: `sections.${section.sectionCode}.questions.${q.bankId}`,
                message: `듣기 문제(${q.bankId})에 오디오 파일이 없습니다`,
              });
            }
          } catch {
            errors.push({
              field: `sections.${section.sectionCode}.questions.${q.bankId}`,
              message: `문제(${q.bankId})의 상세 정보를 가져올 수 없습니다`,
            });
          }
        }

        snapshotSections.push({ ...section, questionsSnapshot });
      } else {
        // 듣기 이외 섹션
        const questionsSnapshot: QuestionBankDetail[] = [];

        for (const q of section.questions) {
          try {
            const detail = await fetchQuestionDetail(q.bankId);
            questionsSnapshot.push(detail);
          } catch {
            errors.push({
              field: `sections.${section.sectionCode}.questions.${q.bankId}`,
              message: `문제(${q.bankId})의 상세 정보를 가져올 수 없습니다`,
            });
          }
        }

        snapshotSections.push({ ...section, questionsSnapshot });
      }
    }

    // 검증 에러가 있으면 422 반환
    if (errors.length > 0) {
      res.status(422).json({
        success: false,
        errors,
        warnings,
      });
      return;
    }

    // ACID T1-05: 원자적 상태 전이 (optimistic concurrency)
    // updateMany WHERE status='DRAFT' 를 사용하여 동시 요청 방지
    const updateResult = await prisma.examSet.updateMany({
      where: {
        id,
        status: 'DRAFT',
      },
      data: {
        status: 'UPLOADED',
        snapshotJson: snapshotSections as unknown as object,
        uploadedAt: new Date(),
        uploadedById: req.admin.sub,
      },
    });

    if (updateResult.count === 0) {
      throw new AppError(
        409,
        '시험세트 상태가 이미 변경되었습니다. 다른 관리자가 먼저 처리했을 수 있습니다',
      );
    }

    // 업데이트된 시험세트 조회
    const updated = await prisma.examSet.findUnique({ where: { id } });

    res.json({
      success: true,
      data: updated,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (err) {
    next(err);
  }
}
