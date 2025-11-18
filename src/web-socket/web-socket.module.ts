import { Module } from '@nestjs/common';
import { WebSocketResolver } from './web-socket.resolver';
import { WebSocketService } from './web-socket.service';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ChatGateway } from 'src/common/chat/chat.gateway';

@Module({
  imports: [ PrismaModule, AuthModule, ConfigModule ],
  providers: [WebSocketResolver, WebSocketService, ChatGateway,],
  exports: [WebSocketService],
})
export class WebSocketModule {}
