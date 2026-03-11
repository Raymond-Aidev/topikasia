import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../../../config/database';
import { env } from '../../../config/env';
import { AppError } from '../../../shared/types';

const SALT_ROUNDS = 12;

function getS3Client(): S3Client {
  return new S3Client({
    region: env.AWS_REGION || 'ap-northeast-2',
    credentials:
      env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: env.AWS_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
}

/**
 * POST /api/admin/examinees
 * 응시자 생성 - multipart/form-data (photo 포함)
 * ACID T1-03: DB 먼저 저장, 이후 S3 업로드 (고아 파일 방지)
 * ACID T3-01: P2002 unique constraint → 409
 */
export async function createExaminee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      loginId,
      password,
      name,
      registrationNumber,
      seatNumber,
      institutionName,
      examRoomName,
      assignedExamSetId,
    } = req.body;

    if (!loginId || !password || !name || !registrationNumber) {
      throw new AppError(400, '필수 항목을 모두 입력해주세요 (loginId, password, name, registrationNumber)');
    }

    // 배정할 시험세트가 있으면 ACTIVE 상태인지 확인
    if (assignedExamSetId) {
      const examSet = await prisma.examSet.findUnique({
        where: { id: assignedExamSetId },
        select: { status: true },
      });
      if (!examSet) {
        throw new AppError(404, '시험세트를 찾을 수 없습니다');
      }
      if (examSet.status !== 'ACTIVE') {
        throw new AppError(400, 'ACTIVE 상태의 시험세트만 배정할 수 있습니다');
      }
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // ACID T1-03: DB first, then S3
    let examinee;
    try {
      examinee = await prisma.examinee.create({
        data: {
          loginId,
          passwordHash,
          name,
          registrationNumber,
          seatNumber: seatNumber ? Number(seatNumber) : null,
          institutionName: institutionName || null,
          examRoomName: examRoomName || null,
          assignedExamSetId: assignedExamSetId || null,
          createdById: req.admin!.sub,
        },
      });
    } catch (err: any) {
      // ACID T3-01: P2002 unique constraint
      if (err.code === 'P2002') {
        const target = (err.meta?.target as string[])?.join(', ') || '알 수 없는 필드';
        throw new AppError(409, `중복된 데이터가 존재합니다: ${target}`);
      }
      throw err;
    }

    // S3 사진 업로드 (파일이 있는 경우)
    const file = (req as any).file as Express.Multer.File | undefined;
    if (file && env.AWS_BUCKET_NAME) {
      try {
        const s3Key = `examinees/${examinee.id}/photo-${Date.now()}.${file.originalname.split('.').pop()}`;
        const s3Client = getS3Client();
        await s3Client.send(
          new PutObjectCommand({
            Bucket: env.AWS_BUCKET_NAME,
            Key: s3Key,
            Body: file.buffer,
            ContentType: file.mimetype,
          }),
        );

        const photoUrl = `https://${env.AWS_BUCKET_NAME}.s3.${env.AWS_REGION || 'ap-northeast-2'}.amazonaws.com/${s3Key}`;
        await prisma.examinee.update({
          where: { id: examinee.id },
          data: { photoUrl },
        });
        examinee = { ...examinee, photoUrl };
      } catch (uploadErr) {
        // S3 업로드 실패해도 DB 레코드는 유지 (T1-03)
        console.error('[S3 Upload Error]', uploadErr);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        id: examinee.id,
        loginId: examinee.loginId,
        name: examinee.name,
        registrationNumber: examinee.registrationNumber,
        seatNumber: examinee.seatNumber,
        photoUrl: examinee.photoUrl,
        institutionName: examinee.institutionName,
        examRoomName: examinee.examRoomName,
        status: examinee.status,
        assignedExamSetId: examinee.assignedExamSetId,
        createdAt: examinee.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}
