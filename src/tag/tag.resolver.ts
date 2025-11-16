import { Args, Mutation, Resolver, Query, Context } from '@nestjs/graphql';
import { ITagService, TAG_TOKEN } from './tag.interface';
import { Inject } from '@nestjs/common';
import { CreateTag, TagReturn, UpdateTag } from 'src/common/models/tag/tag.model';
import { TagReponse } from 'src/common/models/tag/tag.response';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UseGuards } from '@nestjs/common';

@Resolver(() => TagReponse)
export class TagResolver {
    constructor(@Inject(TAG_TOKEN) private readonly tagService: ITagService) { }

    @Query(() => TagReponse)
    async getAllTags(): Promise<TagReponse> {
        return this.tagService.getAllTags();
    }
    @Query(() => TagReponse)
    async getTagById(@Args('id') id: string): Promise<TagReponse> {
        return this.tagService.getTagById(id);
    }
    @Mutation(() => TagReponse)
    @UseGuards(AuthGuard)
    async createTag(@Args('data') data: CreateTag): Promise<TagReponse> {
        return this.tagService.createTag(data);
    }
    @Mutation(() => TagReponse)
    @UseGuards(AuthGuard)
    async updateTag(@Args('id') id: string, @Args('data') data: UpdateTag): Promise<TagReponse> {
        return this.tagService.updateTag(id, data);
    }
    @Mutation(() => TagReponse)
    @UseGuards(AuthGuard)
    async deleteTag(@Args('id') id: string): Promise<TagReponse> {
        return this.tagService.deleteTag(id);
    }
}
