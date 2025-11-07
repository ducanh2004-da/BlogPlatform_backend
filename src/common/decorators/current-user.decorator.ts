import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * CurrentUser decorator
 * - Hỗ trợ cả GraphQL và REST contexts
 * - Trả về object user đã được AuthGuard gán vào req.user / ctx.user
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    // Kiểm tra type context để xử lý GraphQL vs HTTP
    // Cast to string to avoid TypeScript error when comparing with 'graphql'
    const ctxType = (context.getType?.() as unknown as string) ?? 'unknown';

    let req: any;

    if (ctxType === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      // getContext() trả về object context bạn cấu hình khi tạo GraphQLModule (thường chứa req/res)
      const gCtx = gqlCtx.getContext();
      req = gCtx?.req;
    } else {
      // Fallback cho REST
      req = context.switchToHttp().getRequest();
    }

    if (!req || !req.user) {
      throw new UnauthorizedException('User not found in request');
    }

    // Nếu caller truyền data (ví dụ 'id' hoặc 'email') có thể return specific field
    if (typeof data === 'string' && data in req.user) {
      return req.user[data];
    }

    return req.user;
  },
);
