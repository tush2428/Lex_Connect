
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdvocateService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(userId: string, body: any) {
    const {
      phone,
      barCouncilNumber,
      city,
      state,
      referralInformation,
      bio,
      yearsExperience = 0,
      experienceSummary,
      qualifications = [],
      specializations = [],
    } = body;

    if (
      !phone ||
      !barCouncilNumber ||
      !city ||
      !state
    ) {
      throw new BadRequestException(
        'Phone, bar council number, city and state are required',
      );
    }

    if (
      !Array.isArray(qualifications) ||
      !Array.isArray(specializations)
    ) {
      throw new BadRequestException(
        'Qualifications and specializations must be arrays',
      );
    }

    if (
      !Number.isInteger(yearsExperience) ||
      yearsExperience < 0
    ) {
      throw new BadRequestException(
        'Years experience must be a non-negative integer',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'ADVOCATE') {
      throw new NotFoundException(
        'Advocate user not found',
      );
    }

    const existing = await this.prisma.advocateProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException(
        'Advocate profile already exists',
      );
    }

    try {
      return await this.prisma.advocateProfile.create({
        data: {
          userId,
          phone,
          barCouncilNumber,
          city,
          state,
          referralInformation,
          bio,
          yearsExperience,
          experienceSummary,
          qualifications: {
            create: qualifications,
          },
          specializations: {
            connectOrCreate: specializations.map(
              (name: string) => ({
                where: { name },
                create: { name },
              }),
            ),
          },
        },
        include: {
          qualifications: true,
          specializations: true,
        },
      });
    } catch (error) {
      if ((error as any).code === 'P2002') {
        throw new ConflictException(
          'Phone or bar council number already exists',
        );
      }
      throw error;
    }
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.advocateProfile.findUnique({
      where: { userId },
      include: {
        qualifications: true,
        specializations: true,
      },
    });

    if (!profile) {
      throw new NotFoundException(
        'Advocate profile not found',
      );
    }

    return profile;
  }
}
