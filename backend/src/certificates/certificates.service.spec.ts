import {
  BadRequestException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { CertificatesService } from './certificates.service';

describe('CertificatesService', () => {
  const userId = 'u1';
  const courseId = 'c1';

  describe('issueCertificate', () => {
    it('throws COURSE_NOT_FOUND when course missing', async () => {
      const prisma = {
        course: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };
      const service = new CertificatesService(prisma as never);

      await expect(
        service.issueCertificate(userId, courseId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws CERTIFICATE_NOT_ELIGIBLE when progress below 100', async () => {
      const prisma = {
        course: {
          findUnique: jest.fn().mockResolvedValue({ id: courseId }),
        },
        enrollment: {
          findUnique: jest.fn().mockResolvedValue({
            progress: 99.5,
          }),
        },
      };
      const service = new CertificatesService(prisma as never);

      try {
        await service.issueCertificate(userId, courseId);
        throw new Error('expected rejection');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect((err as HttpException).getResponse()).toEqual(
          expect.objectContaining({ code: 'CERTIFICATE_NOT_ELIGIBLE' }),
        );
      }
    });

    it('upserts certificate when enrolled and progress is 100', async () => {
      const cert = {
        id: 'cert1',
        userId,
        courseId,
        issuedAt: new Date(),
      };
      const prisma = {
        course: {
          findUnique: jest.fn().mockResolvedValue({ id: courseId }),
        },
        enrollment: {
          findUnique: jest.fn().mockResolvedValue({
            progress: 100,
          }),
        },
        certificate: {
          upsert: jest.fn().mockResolvedValue(cert),
        },
      };
      const service = new CertificatesService(prisma as never);

      const result = await service.issueCertificate(userId, courseId);
      expect(result).toEqual(cert);
      expect(prisma.certificate.upsert).toHaveBeenCalled();
    });
  });
});
