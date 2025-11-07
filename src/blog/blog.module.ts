import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogResolver } from './blog.resolver';
import { IBlogService, BLOG_TOKEN } from './blog.interface';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
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
