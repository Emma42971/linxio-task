import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { VelocityService } from './velocity.service';
import { AnalyticsController } from './analytics.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, VelocityService],
  exports: [AnalyticsService, VelocityService],
})
export class AnalyticsModule {}


