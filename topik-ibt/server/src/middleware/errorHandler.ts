import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/types';
import { env } from '../config/env';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Prisma known request errors
  if ((err as any).code === 'P2002') {
    res.status(409).json({
      success: false,
      message: '중복된 데이터가 존재합니다',
    });
    return;
  }

  console.error('[UnhandledError]', err);

  res.status(500).json({
    success: false,
    message: '서버 내부 오류가 발생했습니다',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
