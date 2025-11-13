import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateComment, UpdateComment, CommentReturn } from 'src/common/models/comment/comment.model';
import { CommentResponse } from 'src/common/models/comment/comment.response';
import { ICommentService } from './comment.interface';

@Injectable()
export class CommentService implements ICommentService {
    constructor(private readonly prisma: PrismaService) {}

    async getCommentByBlogId(blogId: string): Promise<CommentResponse>{
        try{
            const comments = await this.prisma.comment.findMany({
                where: { blogId },
                include: { user: true }
            });
            if(!comments || comments.length === 0){
                return{
                    success: false,
                    message: "Don't have any comments",
                    comments: []
                }
            }
            const formatted = comments.map(c => ({
                ...c,
                content: c.content ?? ''
            })) as CommentReturn[];
            return{
                success: true,
                message: "Comments retrieved successfully",
                comments: formatted
            }
        }catch(err){
            return {
                success: false,
                message: "Error retrieving comments",
                comments: []
            }
        }
    }

    async createComment(data: CreateComment, userId: string): Promise<CommentResponse>{
        try{
            if(!data.blogId || !userId){
                return{
                    success: false,
                    message: 'UserId and BlogId are required',
                    comments: []
                }
            }
            const newComment = await this.prisma.comment.create({
                data:{
                    content: data.content,
                    blogId: data.blogId,
                    userId: userId
                },
                include: {user: true}
            });
            return {
                success: true,
                message: 'Comment created successfully',
                comments: [newComment as CommentReturn]
            }
        }catch(err){
            return{
                success: false,
                message: 'Error creating comment',
                comments: []
            }
        }
    }
}
