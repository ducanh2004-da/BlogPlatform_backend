import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentResolver } from './comment.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ICommentService, COMMENT_TOKEN } from './comment.interface';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [{
    provide: COMMENT_TOKEN,
    useClass: CommentService
  }, CommentResolver],
  exports: [COMMENT_TOKEN]
})
export class CommentModule { }
