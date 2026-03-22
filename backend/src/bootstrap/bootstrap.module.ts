import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { BootstrapService } from './bootstrap.service';

@Module({
  imports: [CommonModule],
  providers: [BootstrapService],
})
export class BootstrapModule {}
