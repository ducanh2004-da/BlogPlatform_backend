import { Args, Mutation, Resolver, Query, Context } from '@nestjs/graphql';
import { ICommentService, COMMENT_TOKEN } from './comment.interface';
import { Inject, UseGuards } from '@nestjs/common';
import { CommentResponse } from 'src/common/models/comment/comment.response';
import { CommentReturn, CreateComment } from 'src/common/models/comment/comment.model';
import { AuthGuard } from 'src/common/guards/auth.guard';

@Resolver(() => CommentResponse)
export class CommentResolver {
    constructor(@Inject(COMMENT_TOKEN) private readonly commentService: ICommentService){}

    @Query(() => CommentResponse)
    async getCommentByBlog(@Args('blogId') blogId: string): Promise<CommentResponse>{
        return this.commentService.getCommentByBlogId(blogId);
    }

    @Mutation(() => CommentResponse)
    @UseGuards(AuthGuard)
    async createComment(@Args('data') data: CreateComment, @Context() ctx: any ){
        return this.commentService.createComment(data, ctx?.user?.sub);
    }
}
