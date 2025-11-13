import { Module } from '@nestjs/common';
import { LikeResolver } from './like.resolver';
import { LikeService } from './like.service';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ILikeService, LIKE_TOKEN } from './like.interface';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [
    {
      provide: LIKE_TOKEN,
      useClass: LikeService
    },
    LikeResolver
  ],
  exports: [LIKE_TOKEN]
})
export class LikeModule {}
