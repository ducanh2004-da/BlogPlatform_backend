import { CommentResponse } from "src/common/models/comment/comment.response";
import { CreateResponse } from "src/common/models/create.response";
import { LikeResponse } from "src/common/models/like/like.response";
import { LikeReturn } from "src/common/models/like/like.model";
export interface ILikeService {
    getLikeByBlog(blogId: string, skip: number, take: number): Promise<LikeResponse>
    createLike(userId: string, blogId: string): Promise<CreateResponse>
    unLike(userId: string, blogId: string): Promise<CreateResponse>
}
export const LIKE_TOKEN = 'ILikeService';