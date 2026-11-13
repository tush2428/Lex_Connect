
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { EmailService } from './email/email.service';

import { UserRole, Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  // Generate, hash, save and email a 6-digit OTP
  private async generateAndSendOtp(
    userId: string,
    email: string,
  ): Promise<void> {
    const otp = randomInt(100000, 1000000).toString();

    const otpHash = await bcrypt.hash(otp, 10);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.emailVerificationOtp.upsert({
      where: { userId },
      create: {
        userId,
        otpHash,
        expiresAt,
        attempts: 0,
      },
      update: {
        otpHash,
        expiresAt,
        attempts: 0,
        createdAt: new Date(),
      },
    });

    await this.emailService.sendVerificationOtp(email, otp);
  }

  // User registration
  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name.trim(),
          email,
          password: hashedPassword,
          role: dto.role ?? UserRole.CLIENT,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await this.generateAndSendOtp(user.id, user.email);

      return {
        message:
          'Registration successful. Please check your email for the verification OTP.',
        user,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email is already registered');
      }

      throw error;
    }
  }

  // Verify email OTP
  async verifyEmail(emailInput: string, otp: string) {
    const email = emailInput.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        emailVerificationOtp: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid email or OTP');
    }

    if (user.isEmailVerified) {
      return {
        message: 'Email is already verified',
      };
    }

    const otpRecord = user.emailVerificationOtp;

    if (!otpRecord) {
      throw new BadRequestException(
        'OTP not found. Please request a new OTP.',
      );
    }

    if (otpRecord.expiresAt.getTime() < Date.now()) {
      await this.prisma.emailVerificationOtp.delete({
        where: { userId: user.id },
      });

      throw new BadRequestException(
        'OTP has expired. Please request a new OTP.',
      );
    }

    if (otpRecord.attempts >= 5) {
      await this.prisma.emailVerificationOtp.delete({
        where: { userId: user.id },
      });

      throw new BadRequestException(
        'Maximum OTP attempts exceeded. Please request a new OTP.',
      );
    }

    const otpMatches = await bcrypt.compare(
      otp,
      otpRecord.otpHash,
    );

    if (!otpMatches) {
      const nextAttempts = otpRecord.attempts + 1;

      if (nextAttempts >= 5) {
        await this.prisma.emailVerificationOtp.delete({
          where: { userId: user.id },
        });

        throw new BadRequestException(
          'Maximum OTP attempts exceeded. Please request a new OTP.',
        );
      }

      await this.prisma.emailVerificationOtp.update({
        where: { userId: user.id },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      throw new BadRequestException('Invalid OTP');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
        },
      }),

      this.prisma.emailVerificationOtp.delete({
        where: { userId: user.id },
      }),
    ]);

    return {
      message: 'Email verified successfully. You can now log in.',
    };
  }

  // Resend OTP
  async resendOtp(emailInput: string) {
    const email = emailInput.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        emailVerificationOtp: true,
      },
    });

    if (!user || user.isEmailVerified) {
      return {
        message:
          'If the account requires verification, a new OTP will be sent.',
      };
    }

    const otpRecord = user.emailVerificationOtp;

    if (otpRecord) {
      const elapsedSeconds =
        (Date.now() - otpRecord.createdAt.getTime()) / 1000;

      if (elapsedSeconds < 60) {
        const remainingSeconds = Math.ceil(60 - elapsedSeconds);

        throw new BadRequestException(
          `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
        );
      }
    }

    await this.generateAndSendOtp(user.id, user.email);

    return {
      message: 'A new verification OTP has been sent to your email.',
    };
  }

  // User login
  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'Please verify your email before logging in.',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Login successful',
      accessToken,
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }
}
