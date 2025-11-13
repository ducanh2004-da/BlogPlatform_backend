import { CommentResponse } from "src/common/models/comment/comment.response";
import { CreateComment, CommentReturn } from 'src/common/models/comment/comment.model';
export interface ICommentService {
    getCommentByBlogId(blogId: string): Promise<CommentResponse>
    createComment(data: CreateComment, userId: string): Promise<CommentResponse>
}
export const COMMENT_TOKEN = 'ICommentService';