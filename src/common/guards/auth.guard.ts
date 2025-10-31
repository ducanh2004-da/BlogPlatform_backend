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

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) { }

    canActivate(context: ExecutionContext): boolean {
        const ctx = GqlExecutionContext.create(context).getContext();
        const authHeader = ctx.req?.headers?.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Invalid authorization header');
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new UnauthorizedException('No token provided');
        }
        try {
            const decoded = this.jwtService.verify(token);
            ctx.user = decoded;
            return true;
        } catch (ex) {
            throw new UnauthorizedException('Invalid token');
        }
    }
}

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      ROLES_KEY,
      context.getHandler(),
    );
    if (!requiredRoles) return true;

    const ctx: { user?: { role: string } } =
      GqlExecutionContext.create(context).getContext();
    const user = ctx.user;

    return !!user && requiredRoles.includes(user.role);
  }
}