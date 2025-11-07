import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TagReturn, CreateTag, UpdateTag } from 'src/common/models/tag/tag.model';
import { TagReponse } from 'src/common/models/tag/tag.response';
import { ITagService, TAG_TOKEN } from './tag.interface';

@Injectable()
export class TagService implements ITagService {
    constructor(private readonly prisma: PrismaService) { }

    async getAllTags(): Promise<TagReponse> {
        try {
            const tags = await this.prisma.tag.findMany({
                include: {
                    blog: true
                }
            });
            if (!tags) {
                return {
                    success: false,
                    message: 'No tags found',
                    tags: []
                }
            }
            return {
                success: true,
                message: 'Tags retrieved successfully',
                tags: tags as TagReturn[]
            }
        }
        catch (error) {
            return {
                success: false,
                message: 'Error retrieving tags',
                tags: []
            }
        }
    }

    async getTagById(id: string): Promise<TagReponse> {
        try {
            const tag = await this.prisma.tag.findUnique({
                where: { id },
                include: {
                    blog: true
                }
            });
            if (!tag) {
                return {
                    success: false,
                    message: 'Tag not found',
                    tags: []
                }
            }
            return {
                success: true,
                message: 'Tag retrieved successfully',
                tags: [tag as TagReturn]
            }
        }
        catch (error) {
            return {
                success: false,
                message: 'Error retrieving tag',
                tags: []
            }
        }
    }

    async createTag(data: CreateTag): Promise<TagReponse> {
        try {
            const newTag = await this.prisma.tag.create({
                data: {
                    name: data.name
                }
            });
            return {
                success: true,
                message: 'Tag created successfully',
                tags: [newTag as TagReturn]
            }
        } catch (error) {
            return {
                success: false,
                message: 'Error creating tag',
                tags: []
            }
        }
    }

    async updateTag(id: string, data: UpdateTag): Promise<TagReponse> {
        try {
            const updatedTag = await this.prisma.tag.update({
                where: { id },
                data: {
                    name: data.name
                }
            }); 
            return {
                success: true,
                message: 'Tag updated successfully',
                tags: [updatedTag as TagReturn]
            }
        } catch (error) {
            return {
                success: false,
                message: 'Error updating tag',
                tags: []
            }
        }
    }

    async deleteTag(id: string): Promise<TagReponse> {
        try {
            const deletedTag = await this.prisma.tag.delete({
                where: { id }
            });
            return {
                success: true,
                message: 'Tag deleted successfully',
                tags: [deletedTag as TagReturn]
            }
        } catch (error) {
            return {
                success: false,
                message: 'Error deleting tag',
                tags: []
            }
        }
    }

}
