import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/role.decorator';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

// guard xác thực người dùng
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService, private readonly config: ConfigService) { }

  // Kiểm tra cookie trước, nếu không có mới fallback sang header

  private extractTokenFromRequest(req: Request): string | undefined {
    // 1. Kiểm tra cookie trước (priority)
    if (req?.cookies && req.cookies['Authentication']) {
      return req.cookies['Authentication'];
    }

    // 2. Fallback sang Authorization header
    const authHeader = req?.headers?.authorization || req?.headers?.Authorization as string | undefined;

    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }

    return undefined;
  }

  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context).getContext();
    const authHeader = ctx.req?.headers?.authorization;

    // For REST controllers, ctx may be undefined; fallback to switchToHttp
    const req: Request = ctx?.req ?? context.switchToHttp().getRequest<Request>();

    const token = this.extractTokenFromRequest(req);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    try {
      const secret = this.config.get<string>('JWT_ACCESS_SECRET');
      const decoded = this.jwtService.verify(token, { secret });
      ctx.user = decoded;
      req['user'] = decoded; // gán user vào req để sử dụng trong REST API nếu cần
      return true;
    } catch (ex) {
      if (ex.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
}

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      ROLES_KEY,
      context.getHandler(),
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context).getContext();
    const user = ctx.user;

    if (!user || !user.role) {
      throw new UnauthorizedException('User role not found');
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new UnauthorizedException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}