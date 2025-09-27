import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { NotificationStatusController } from './notification-status.controller';
import { NotificationStatusService } from './notification-status.service';
import { ExternalNcDetailService } from './services/external-nc-detail.service';
import { NC_DETAIL_SERVICE_TOKEN } from './interfaces/nc-detail.interface';
import ncApiConfig from '../../config/nc-api.config';

@Module({
  imports: [
    ConfigModule.forFeature(ncApiConfig),
    HttpModule,
  ],
  controllers: [NotificationStatusController],
  providers: [
    NotificationStatusService,
    {
      provide: NC_DETAIL_SERVICE_TOKEN,
      useClass: ExternalNcDetailService,
    },
  ],
  exports: [NotificationStatusService, NC_DETAIL_SERVICE_TOKEN],
})
export class NotificationStatusModule {}