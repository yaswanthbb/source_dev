import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private readonly emailUser: string | null = null;

  constructor(private readonly configService: ConfigService) {
    const user = this.configService.get<string>('EMAIL_USER')?.trim();
    const rawPass = this.configService.get<string>('EMAIL_APP_PASSWORD');
    const pass = rawPass ? rawPass.replace(/\s+/g, '') : undefined;

    if (
      user &&
      pass &&
      user !== 'your-gmail@gmail.com' &&
      pass !== 'your-16-char-app-password'
    ) {
      this.emailUser = user;
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass,
        },
      });
      this.logger.log('Nodemailer Gmail transporter initialized successfully.');
    } else {
      this.logger.warn(
        'EMAIL_USER or EMAIL_APP_PASSWORD is not set. Email delivery is disabled.',
      );
    }
  }

  async sendOtpEmail(toEmail: string, otp: string): Promise<boolean> {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Code</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0d0f17;
      color: #e2e8f0;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #0d0f17;
      padding: 40px 16px;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
      background-color: #151926;
      border: 1px solid #23293d;
      border-radius: 16px;
      padding: 36px 28px;
      text-align: center;
    }
    .brand {
      font-size: 20px;
      font-weight: 800;
      color: #8b5cf6;
      letter-spacing: 0.5px;
      margin-bottom: 24px;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 12px;
    }
    .description {
      font-size: 14px;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 28px;
    }
    .otp-card {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%);
      border: 1px solid rgba(139, 92, 246, 0.35);
      border-radius: 12px;
      padding: 20px 24px;
      margin: 0 auto 28px;
      display: inline-block;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #a78bfa;
      margin: 0;
    }
    .expiry {
      font-size: 12px;
      color: #f59e0b;
      font-weight: 600;
      margin-bottom: 24px;
    }
    .footer {
      border-top: 1px solid #23293d;
      padding-top: 20px;
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="brand">source:dev</div>
      <div class="title">Reset Your Password</div>
      <div class="description">
        We received a request to reset your password. Use the single-use 6-digit verification code below to proceed:
      </div>
      
      <div class="otp-card">
        <div class="otp-code">${otp}</div>
      </div>
      
      <div class="expiry">⏱ This code expires in 10 minutes.</div>
      
      <div class="footer">
        If you did not request this password reset, please ignore this email or contact support if you suspect unauthorized access.
      </div>
    </div>
  </div>
</body>
</html>
    `;

    if (!this.transporter || !this.emailUser) {
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: `"source:dev" <${this.emailUser}>`,
        to: toEmail,
        subject: `${otp} is your source:dev password reset code`,
        html: htmlTemplate,
      });

      this.logger.log('Password reset OTP email sent successfully.');
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(
        `Failed to send password reset email: ${error.message}`,
      );
      return false;
    }
  }
}
