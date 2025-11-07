import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BlogReturn, CreateBlog, UpdateBlog } from 'src/common/models/blog/blog.model';
import { BlogResponse } from 'src/common/models/blog/blog.response';
import { IBlogService, BLOG_TOKEN } from './blog.interface';

@Injectable()
export class BlogService implements IBlogService {
    constructor(private readonly prisma: PrismaService) { }

    async getAllBlogs(): Promise<BlogResponse> {
        try {
            const blogs = await this.prisma.blog.findMany({
                include: {
                    user: true,
                    tags: true,
                    comments: {
                        include: {
                            user: true
                        }
                    }
                }
            });
            if (!blogs) {
                return {
                    success: false,
                    message: 'No blogs found',
                    blogs: []
                }
            }
            return {
                success: true,
                message: 'Blogs retrieved successfully',
                blogs: blogs as BlogReturn[]
            }
        } catch (error) {
            return {
                success: false,
                message: 'Error retrieving blogs',
                blogs: []
            }
        }
    }

    async getBlogById(id: string): Promise<BlogResponse> {
        try {
            const blog = await this.prisma.blog.findUnique({
                where: { id },
                include: {
                    user: true,
                    tags: true,
                    comments: {
                        include: {
                            user: true
                        }
                    }
                }
            });
            if (!blog) {
                return {
                    success: false,
                    message: 'Blog not found',
                    blogs: []
                }
            }
            return {
                success: true,
                message: 'Blog retrieved successfully',
                blogs: [blog as BlogReturn]
            }
        }
        catch (error) {
            return {
                success: false,
                message: 'Error retrieving blog',
                blogs: []
            }
        }
    }

    async createBlog(data: CreateBlog): Promise<BlogResponse> {
        try {
            if (!data.userId || !data.tagId) {
                return {
                    success: false,
                    message: 'UserId and TagId are required',
                    blogs: []
                }
            }
            const newBlog = await this.prisma.blog.create({
                data: {
                    title: data.title,
                    content: data.content,
                    userId: data.userId,
                    tags: {
                        connect: { id: data.tagId }
                    }
                },
                include: {
                    user: true,
                    tags: true,
                    comments: {
                        include: {
                            user: true
                        }
                    }
                }
            });
            return {
                success: true,
                message: 'Blog created successfully',
                blogs: [newBlog as BlogReturn]
            }
        } catch (error) {
            return {
                success: false,
                message: 'Error creating blog',
                blogs: []
            }
        }
    }
    async updateBlog(blogId: string, data: UpdateBlog): Promise<BlogResponse> {
        try {
            if (!data.tagId) {
                return {
                    success: false,
                    message: 'UserId and TagId are required',
                    blogs: []
                }
            }
            const updatedBlog = await this.prisma.blog.update({
                where: { id: blogId },
                data: {
                    title: data.title,
                    content: data.content,
                    tags: {
                        connect: { id: data.tagId }
                    }
                },
                include: {
                    user: true,
                    tags: true,
                    comments: {
                        include: {
                            user: true
                        }
                    }
                }
            });
            return {
                success: true,
                message: 'Blog updated successfully',
                blogs: [updatedBlog as BlogReturn]
            }
        } catch (error) {
            return {
                success: false,
                message: 'Error updating blog',
                blogs: []
            }
        }
    }
    async deleteBlog(id: string): Promise<BlogResponse> {
        try {
            if (!id) {
                return {
                    success: false,
                    message: 'Blog id is required',
                    blogs: []
                }
            }
            await this.prisma.blog.delete({
                where: { id }
            });
            return {
                success: true,
                message: 'Blog deleted successfully',
                blogs: []
            }
        } catch (error) {
            return {
                success: false,
                message: 'Error deleting blog',
                blogs: []
            }
        }
    }
}
