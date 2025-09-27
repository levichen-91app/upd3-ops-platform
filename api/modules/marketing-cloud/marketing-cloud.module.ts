import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MarketingCloudController } from './marketing-cloud.controller';
import { MarketingCloudService } from './marketing-cloud.service';
import externalApisConfig from '../../config/external-apis.config';

/**
 * Marketing Cloud Module
 * Handles Marketing Cloud Device API integration
 */
@Module({
  imports: [
    // HTTP module for external API calls
    HttpModule.register({
      timeout: 10000, // Default timeout, will be overridden by service configuration
      maxRedirects: 0, // No redirects for security
      validateStatus: (status) => {
        // Allow all status codes - let the service handle error mapping
        return status >= 200 && status < 600;
      },
    }),

    // Configuration module with external APIs config
    ConfigModule.forFeature(externalApisConfig),
  ],
  controllers: [MarketingCloudController],
  providers: [MarketingCloudService],
  exports: [MarketingCloudService], // Export service for potential use in other modules
})
export class MarketingCloudModule {}
