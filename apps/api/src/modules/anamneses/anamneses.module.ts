import { Module } from '@nestjs/common';
import { AnamnesesController } from './anamneses.controller';
import { AnamnesesService } from './anamneses.service';

@Module({
  controllers: [AnamnesesController],
  providers: [AnamnesesService],
  exports: [AnamnesesService],
})
export class AnamnesesModule {}
