import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { NotificationHistoryController } from './notification-history.controller';
import { NotificationHistoryService } from './notification-history.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
  ],
  controllers: [NotificationHistoryController],
  providers: [NotificationHistoryService],
  exports: [NotificationHistoryService],
})
export class NotificationHistoryModule {}