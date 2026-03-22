import { Module } from '@nestjs/common';
import { AssignmentsModule } from '../assignments/assignments.module';
import { CertificatesService } from '../certificates/certificates.service';
import { GamificationModule } from '../gamification/gamification.module';
import { LearningController } from './learning.controller';
import { LearningService } from './learning.service';

@Module({
  imports: [AssignmentsModule, GamificationModule],
  controllers: [LearningController],
  providers: [LearningService, CertificatesService],
  exports: [CertificatesService],
})
export class LearningModule {}
