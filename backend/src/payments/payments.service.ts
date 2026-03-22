import { Injectable, NotFoundException } from '@nestjs/common';
import { CourseStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coursesService: CoursesService,
  ) {}

  async checkoutCourse(userId: string, courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        id: courseId,
        status: CourseStatus.PUBLISHED,
      },
      select: {
        id: true,
        title: true,
        priceCents: true,
      },
    });
    if (!course) {
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        courseId,
        amountCents: course.priceCents,
        currency: 'USD',
        provider: 'MOCK',
        status: PaymentStatus.SUCCEEDED,
        externalRef: `mock_${Date.now()}`,
      },
      select: {
        id: true,
        amountCents: true,
        currency: true,
        provider: true,
        status: true,
        createdAt: true,
      },
    });

    const enrollmentResult = await this.coursesService.enrollInCourse(
      userId,
      courseId,
    );

    return {
      payment,
      enrollment: enrollmentResult.enrollment,
      enrolled: enrollmentResult.enrolled,
      course: {
        id: course.id,
        title: course.title,
      },
    };
  }

  listPayments() {
    return this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        amountCents: true,
        currency: true,
        provider: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });
  }
}
