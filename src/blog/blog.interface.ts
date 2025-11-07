import { BlogReturn, CreateBlog, UpdateBlog } from 'src/common/models/blog/blog.model';
import { BlogResponse } from 'src/common/models/blog/blog.response';
export interface IBlogService {
    getAllBlogs(): Promise<BlogResponse>
    getBlogById(id: string): Promise<BlogResponse>
    createBlog(data: CreateBlog): Promise<BlogResponse>
    updateBlog(blogId: string, data: UpdateBlog): Promise<BlogResponse>
    deleteBlog(id: string): Promise<BlogResponse>
}
export const BLOG_TOKEN = 'IBlogService';