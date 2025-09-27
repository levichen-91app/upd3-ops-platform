import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { WhaleApiService } from './services/whale-api.service';
import { WHALE_API_SERVICE_TOKEN } from './interfaces/whale-api.interface';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
  ],
  controllers: [SuppliersController],
  providers: [
    SuppliersService,
    {
      provide: WHALE_API_SERVICE_TOKEN,
      useClass: WhaleApiService,
    },
  ],
  exports: [SuppliersService],
})
export class SuppliersModule {}
