import { Test, TestingModule } from '@nestjs/testing';
import { MarketingCloudController } from './marketing-cloud.controller';

describe('MarketingCloudController', () => {
  let controller: MarketingCloudController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketingCloudController],
    }).compile();

    controller = module.get<MarketingCloudController>(MarketingCloudController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});