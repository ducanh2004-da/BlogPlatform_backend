import { Args, Mutation, Resolver, Query, Context } from '@nestjs/graphql';
import { BlogReturn, CreateBlog, UpdateBlog } from 'src/common/models/blog/blog.model';
import { BlogResponse } from 'src/common/models/blog/blog.response';
import { IBlogService, BLOG_TOKEN } from './blog.interface';
import { Inject } from '@nestjs/common';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Resolver(() => BlogResponse)
export class BlogResolver {
    constructor(@Inject(BLOG_TOKEN) private readonly blogService: IBlogService) { }

    @Query(() => BlogResponse)
    async getAllBlogs(): Promise<BlogResponse> {
        return this.blogService.getAllBlogs();
    }

    @Query(() => BlogResponse)
    async getBlogById(@Args('id') id: string): Promise<BlogResponse> {
        return this.blogService.getBlogById(id);
    }

    @Query(() => BlogResponse)
    async getBlogByUserId(@Args('userId') userId: string): Promise<BlogResponse> {
        return this.blogService.getBlogByUserId(userId);
    }

    @Mutation(() => BlogResponse)
    @UseGuards(AuthGuard)
    async createBlog(@Args('data') data: CreateBlog): Promise<BlogResponse> {
        return this.blogService.createBlog(data);
    }

    @Mutation(() => BlogResponse)
    @UseGuards(AuthGuard)
    async updateBlog(
        @Args('blogId') blogId: string, 
        @Args('data') data: UpdateBlog,
        @CurrentUser() user: any
    ): Promise<BlogResponse> {
        return this.blogService.updateBlog(user, blogId, data);
    }

    @Mutation(() => BlogResponse)
    @UseGuards(AuthGuard)
    async deleteBlog(@Args('id') id: string): Promise<BlogResponse> {
        return this.blogService.deleteBlog(id);
    }

    @Query(() => BlogResponse)
    async getTop5Like(): Promise<BlogResponse>{
        return this.blogService.getTop5Like();
    }

    @Query(() => BlogResponse)
    async getTop5Recent(): Promise<BlogResponse>{
        return this.blogService.getTop5Recent();
    }
}
