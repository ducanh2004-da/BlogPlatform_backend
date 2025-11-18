import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogResolver } from './blog.resolver';
import { IBlogService, BLOG_TOKEN } from './blog.interface';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [
    {
      provide: BLOG_TOKEN,
      useClass: BlogService
    }, 
    BlogResolver
  ],
  exports: [BLOG_TOKEN]
})
export class BlogModule {}
