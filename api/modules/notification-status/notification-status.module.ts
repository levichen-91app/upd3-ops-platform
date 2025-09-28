import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { NotificationStatusController } from './notification-status.controller';
import { NotificationStatusService } from './notification-status.service';
import { NotificationStatusReportsService } from './services/notification-status-reports.service';
import { ExternalNSReportService } from './services/external-ns-report.service';
import { ExternalNcDetailService } from './services/external-nc-detail.service';
import { MarketingCloudService } from './services/marketing-cloud.service';
import { WhaleApiService } from './services/whale-api.service';
import { NC_DETAIL_SERVICE_TOKEN } from './interfaces/nc-detail.interface';
import { MARKETING_CLOUD_SERVICE_TOKEN } from './interfaces/marketing-cloud.interface';
import { WHALE_API_SERVICE_TOKEN } from './interfaces/whale-api.interface';
import { NS_REPORT_SERVICE_TOKEN } from './services/ns-report.service.interface';
import ncApiConfig from '../../config/nc-api.config';
import marketingCloudConfig from '../../config/marketing-cloud.config';
import whaleApiConfig from '../../config/whale-api.config';
import nsReportConfig from '../../config/ns-report.config';

@Module({
  imports: [
    ConfigModule.forFeature(ncApiConfig),
    ConfigModule.forFeature(marketingCloudConfig),
    ConfigModule.forFeature(whaleApiConfig),
    ConfigModule.forFeature(nsReportConfig),
    HttpModule,
  ],
  controllers: [NotificationStatusController],
  providers: [
    NotificationStatusService,
    NotificationStatusReportsService,
    {
      provide: NC_DETAIL_SERVICE_TOKEN,
      useClass: ExternalNcDetailService,
    },
    {
      provide: MARKETING_CLOUD_SERVICE_TOKEN,
      useClass: MarketingCloudService,
    },
    {
      provide: WHALE_API_SERVICE_TOKEN,
      useClass: WhaleApiService,
    },
    {
      provide: NS_REPORT_SERVICE_TOKEN,
      useClass: ExternalNSReportService,
    },
  ],
  exports: [
    NotificationStatusService,
    NotificationStatusReportsService,
    NC_DETAIL_SERVICE_TOKEN,
    MARKETING_CLOUD_SERVICE_TOKEN,
    WHALE_API_SERVICE_TOKEN,
    NS_REPORT_SERVICE_TOKEN,
  ],
})
export class NotificationStatusModule {}
