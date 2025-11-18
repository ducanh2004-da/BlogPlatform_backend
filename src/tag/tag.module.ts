import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagResolver } from './tag.resolver';
import { ITagService, TAG_TOKEN } from './tag.interface';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [
    {
      provide: TAG_TOKEN,
      useClass: TagService
    }
    , TagResolver
  ]
})
export class TagModule { }
