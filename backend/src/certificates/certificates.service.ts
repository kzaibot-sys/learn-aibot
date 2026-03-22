import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class CertificatesService {
  constructor(private readonly prisma: PrismaService) {}

  async issueCertificate(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });

    if (!course) {
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException({
        code: 'LESSON_ACCESS_DENIED',
        message: 'Enrollment required to issue a certificate',
      });
    }

    if (enrollment.progress < 100) {
      throw new BadRequestException({
        code: 'CERTIFICATE_NOT_ELIGIBLE',
        message:
          'Course must be completed (100% progress) to issue a certificate',
      });
    }

    return this.prisma.certificate.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      create: {
        userId,
        courseId,
      },
      update: {},
      select: {
        id: true,
        userId: true,
        courseId: true,
        issuedAt: true,
      },
    });
  }

  async listCertificatesForUser(userId: string) {
    return this.prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            category: true,
            level: true,
          },
        },
      },
    });
  }
}
