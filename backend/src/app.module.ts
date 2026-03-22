import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { LearningModule } from './learning/learning.module';
import { InstructorModule } from './instructor/instructor.module';
import { AdminModule } from './admin/admin.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { SocialModule } from './social/social.module';
import { ChatModule } from './chat/chat.module';
import { GamificationModule } from './gamification/gamification.module';
import { PaymentsModule } from './payments/payments.module';
import { MediaModule } from './media/media.module';
import { PresenceModule } from './presence/presence.module';
import { BootstrapModule } from './bootstrap/bootstrap.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    CoursesModule,
    LearningModule,
    InstructorModule,
    AdminModule,
    CommonModule,
    HealthModule,
    SocialModule,
    ChatModule,
    GamificationModule,
    PaymentsModule,
    MediaModule,
    PresenceModule,
    BootstrapModule,
  ],
})
export class AppModule {}
