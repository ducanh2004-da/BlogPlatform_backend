// src/chat/web-socket.resolver.ts
import { Resolver, Mutation, Context, Query, Args } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { UseGuards, Injectable } from '@nestjs/common';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { WebSocketService } from './web-socket.service';
import { ConversationType, MessageType } from 'src/common/models/chat/chat.model';
import { ConfigService } from '@nestjs/config';

@Injectable()
@Resolver()
export class WebSocketResolver {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly chatService: WebSocketService,
  ) {}

  @Mutation(() => String)
  @UseGuards(AuthGuard)
  createSocketToken(@Context() ctx: any): string {
    const user = ctx.user;
    const payload = {
      sub: user.sub || user.id,
      username: user.username,
      scope: 'socket',
    };

    const secret = this.config.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      // bảo vệ rõ ràng để dễ debug
      throw new Error('JWT_ACCESS_SECRET is not set. Cannot create socket token.');
    }

    // truyền secret trực tiếp (fix tạm)
    const token = this.jwtService.sign(payload, { expiresIn: '2m', secret });
    return token;
  }

  @Mutation(() => ConversationType)
  @UseGuards(AuthGuard)
  async createConversation(
    @Args('userIds', { type: () => [String] }) userIds: string[],
    @Args('title', { type: () => String, nullable: true }) title?: string,
    @Context() ctx?: any,
  ) {
    const user = ctx.user;
    // ensure current user included
    const set = Array.from(new Set([...(user.sub || user.id ? [user.sub || user.id] : []), ...userIds]));
    return this.chatService.createOrGetConversationBetween(set, title);
  }

  @Query(() => [MessageType])
  @UseGuards(AuthGuard)
  async getMessages(
    @Args('conversationId', { type: () => String }) conversationId: string,
    @Args('take', { type: () => Number, nullable: true }) take = 50,
  ) {
    return this.chatService.getMessages(conversationId, take);
  }

  @Query(() => [ConversationType])
  @UseGuards(AuthGuard)
  async getMyConversations(@Context() ctx: any) {
    const user = ctx.user;
    return this.chatService.getUserConversations(user.sub || user.id);
  }
}
