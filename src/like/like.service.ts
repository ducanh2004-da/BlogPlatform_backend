import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { LikeResponse } from 'src/common/models/like/like.response';
import { CreateResponse } from 'src/common/models/create.response';
import { ILikeService,LIKE_TOKEN  } from './like.interface';

@Injectable()
export class LikeService implements ILikeService {
  private readonly logger = new Logger(LikeService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Thêm skip/take để dễ paging (mặc định lấy 100)
  async getLikeByBlog(blogId: string, skip: number = 0, take: number = 100): Promise<LikeResponse> {
    if (!blogId) {
      return {
        success: false,
        message: 'blog is unknown',
        count: 0,
        likes: [],
      };
    }

    try {
      const [count, likes] = await this.prisma.$transaction([
        this.prisma.like.count({ where: { blogId } }),
        this.prisma.like.findMany({
          where: { blogId },
          include: { user: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
      ]);

      return {
        success: true,
        message: 'Like retrieved successfully',
        count,
        likes,
      };
    } catch (err) {
      this.logger.error('getLikeByBlog error', err as any);
      return {
        success: false,
        message: (err as any)?.message ?? 'Like retrieved unsuccessfully',
        count: 0,
        likes: [],
      };
    }
  }

  // Create like - idempotent: nếu đã like rồi -> trả success nhưng không duplicate
  async createLike(userId: string, blogId: string): Promise<CreateResponse> {
    if (!userId || !blogId) {
      return {
        success: false,
        message: 'user or blog are unknown',
      };
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Kiểm tra blog tồn tại
        const blog = await tx.blog.findUnique({ where: { id: blogId } });
        if (!blog) {
          // ném lỗi để rollback (không có thay đổi đã thực hiện)
          throw new Error('Post not found');
        }

        // Thử tạo like (có thể bị P2002 khi race condition)
        try {
          await tx.like.create({
            data: { userId, blogId },
          });
        } catch (err) {
          // Nếu duplicate (P2002) -> đã like rồi -> xử lý idempotent: bỏ qua
          if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            // already liked
            return { alreadyLiked: true };
          }
          throw err; // rethrow other errors
        }

        // Tăng counter
        const updatedBlog = await tx.blog.update({
          where: { id: blogId },
          data: { likeCount: { increment: 1 } },
        });

        return { alreadyLiked: false, likeCount: updatedBlog.likeCount };
      });

      if (result && (result as any).alreadyLiked) {
        return {
          success: true,
          message: 'Already liked',
        };
      }

      return {
        success: true,
        message: 'Like successfully',
      };
    } catch (err) {
      this.logger.error('createLike error', err as any);

      // Nếu là Post not found
      if ((err as any)?.message === 'Post not found') {
        return {
          success: false,
          message: 'Post not found',
        };
      }

      // Bắt lỗi phổ biến khác (nếu muốn, đổi message theo môi trường)
      return {
        success: false,
        message: (err as any)?.message ?? 'Like unsuccessfully',
      };
    }
  }

  // Unlike - idempotent: nếu chưa like -> trả success (no-op)
  async unLike(userId: string, blogId: string): Promise<CreateResponse> {
    if (!userId || !blogId) {
      return {
        success: false,
        message: 'user or blog are unknown',
      };
    }

    try {
      // Tìm xem đã like hay chưa
      const existing = await this.prisma.like.findUnique({
        where: { userId_blogId: { userId, blogId } },
      });

      // Nếu chưa like -> idempotent: no-op -> success (có thể đổi thành lỗi nếu bạn muốn)
      if (!existing) {
        return {
          success: true,
          message: 'No action required (not liked)',
        };
      }

      const result = await this.prisma.$transaction(async (tx) => {
        // Xoá like
        await tx.like.delete({ where: { id: existing.id } });

        // Giảm counter. Nếu do data drift mà decrement dẫn tới số âm, ta set lại 0
        const updated = await tx.blog.update({
          where: { id: blogId },
          data: { likeCount: { decrement: 1 } },
        });

        if (updated.likeCount < 0) {
          // Đảm bảo không có số âm (fix drift)
          await tx.blog.update({
            where: { id: blogId },
            data: { likeCount: 0 },
          });
        }

        return true;
      });

      if (result) {
        return {
          success: true,
          message: 'Unlike successfully',
        };
      }

      return {
        success: false,
        message: 'Unlike unsuccessfully',
      };
    } catch (err) {
      this.logger.error('unLike error', err as any);

      // Nếu P2025 (record not found) hoặc lỗi khác, trả thông điệp phù hợp
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        // record not found
        return {
          success: true,
          message: 'No action required (not liked)',
        };
      }

      return {
        success: false,
        message: (err as any)?.message ?? 'Unlike unsuccessfully',
      };
    }
  }
}
