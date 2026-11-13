
import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('MAIL_HOST');
    const port = Number(
      this.configService.get<string>('MAIL_PORT') || 587,
    );

    const secure =
      this.configService.get<string>('MAIL_SECURE') === 'true';

    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');

    this.from =
      this.configService.get<string>('MAIL_FROM') || user || '';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendVerificationOtp(
    email: string,
    otp: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: 'Lex Connect - Email Verification OTP',

        text: `Your Lex Connect verification OTP is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`,

        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px;">
            <h2 style="color: #1f6b45;">Lex Connect Email Verification</h2>
            <p>Hello,</p>
            <p>Use the following OTP to verify your email address:</p>

            <div style="font-size: 30px; font-weight: bold; letter-spacing: 8px; padding: 16px; background: #f2f7f3; text-align: center;">
              ${otp}
            </div>

            <p>This OTP expires in <strong>10 minutes</strong>.</p>
            <p>Do not share this code with anyone.</p>
            <p>Regards,<br />Lex Connect Team</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);

      throw new InternalServerErrorException(
        'Unable to send verification email. Please try again later.',
      );
    }
  }

  async verifySmtpConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();

      console.log('Gmail SMTP connection successful');

      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);

      return false;
    }
  }
}
