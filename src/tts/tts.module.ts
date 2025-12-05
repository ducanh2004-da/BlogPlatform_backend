// src/tts/tts.module.ts
import { Module } from '@nestjs/common';
import { TtsResolver } from './tts.resolver';
import { TtsService } from './tts.service';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [HttpModule, PrismaModule],
  providers: [TtsResolver, TtsService],
  exports: [TtsService],
})
export class TtsModule {}
