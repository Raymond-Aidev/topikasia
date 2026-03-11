import nodemailer from 'nodemailer';
import { env } from '../../config/env';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

export async function sendVerificationEmail(to: string, code: string): Promise<boolean> {
  const mailer = getTransporter();

  if (!mailer) {
    console.log(`[Email] SMTP 미설정 - 인증코드 콘솔 출력: ${to} → ${code}`);
    return false;
  }

  try {
    await mailer.sendMail({
      from: `"TOPIK Asia" <${env.SMTP_FROM}>`,
      to,
      subject: '[TOPIK Asia] 이메일 인증코드',
      html: `
        <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1a56db; margin-bottom: 24px;">TOPIK Asia 이메일 인증</h2>
          <p style="font-size: 16px; color: #333; margin-bottom: 16px;">
            아래 인증코드를 입력해주세요.
          </p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a56db;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #666;">
            인증코드는 <strong>3분간</strong> 유효합니다.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #999;">
            본인이 요청하지 않은 경우 이 메일을 무시해주세요.
          </p>
        </div>
      `,
    });

    console.log(`[Email] 인증코드 발송 완료: ${to}`);
    return true;
  } catch (err) {
    console.error(`[Email] 발송 실패:`, err);
    return false;
  }
}
