// src/like/like.resolver.ts
import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { LikeService } from './like.service';
import { UnauthorizedException } from '@nestjs/common';
import { LikeResponse } from 'src/common/models/like/like.response';
import { CreateResponse } from 'src/common/models/create.response';
import { LikeReturn } from 'src/common/models/like/like.model';
import { UseGuards, Inject } from '@nestjs/common';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { ILikeService, LIKE_TOKEN } from './like.interface';

@Resolver(() => LikeResponse)
export class LikeResolver {
  constructor(@Inject(LIKE_TOKEN) private readonly likeService: ILikeService) {}

  @Query(() => LikeResponse, { name: 'getLikesByBlog' })
  async getLikesByBlog(
    @Args('blogId') blogId: string,
    @Args('skip', { type: () => Int, nullable: true }) skip = 0,
    @Args('take', { type: () => Int, nullable: true }) take = 100,
  ): Promise<LikeResponse> {
    // gọi service trực tiếp — service đã xử lý validation & errors
    return this.likeService.getLikeByBlog(blogId, skip, take);
  }

  @Mutation(() => CreateResponse, { name: 'createLike' })
  @UseGuards(AuthGuard)
  async createLike(
    @Args('blogId') blogId: string,
    @Context() ctx: any,
  ): Promise<CreateResponse> {
    const user = ctx.req?.user ?? ctx?.user;
    if (!user || !user?.sub) throw new UnauthorizedException('Unauthenticated');

    return this.likeService.createLike(user?.sub, blogId);
  }

  @Mutation(() => CreateResponse, { name: 'unLike' })
  @UseGuards(AuthGuard)
  async unLike(
    @Args('blogId') blogId: string,
    @Context() ctx: any,
  ): Promise<CreateResponse> {
    const user = ctx.req?.user ?? ctx?.user;
    if (!user || !user?.sub) throw new UnauthorizedException('Unauthenticated');

    return this.likeService.unLike(user?.sub, blogId);
  }
}
