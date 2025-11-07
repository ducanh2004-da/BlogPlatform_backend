import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagResolver } from './tag.resolver';
import { ITagService, TAG_TOKEN } from './tag.interface';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: TAG_TOKEN,
      useClass: TagService
    }
    , TagResolver
  ]
})
export class TagModule { }
