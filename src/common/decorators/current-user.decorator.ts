import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserResponse } from '../models/user';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserResponse => {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    if (!request.user) {
      throw new Error('User not found in request');
    }

    return request.user;
  },
);