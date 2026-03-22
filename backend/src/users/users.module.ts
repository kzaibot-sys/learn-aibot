import { Module } from '@nestjs/common';
import { LearningModule } from '../learning/learning.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [LearningModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
