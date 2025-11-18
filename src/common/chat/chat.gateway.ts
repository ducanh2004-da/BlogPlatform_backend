// src/chat/chat.gateway.ts - FIXED VERSION
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { WebSocketService } from 'src/web-socket/web-socket.service';
import { ConfigService } from '@nestjs/config';

//cấu hình cho web socket gateway
@WebSocketGateway({
  //tất cả socket của chat sẽ ở URL như ws://host/chat. Giúp tách các loại kết nối (ví dụ /notifications, /chat)
  namespace: '/chat',
  //cors cho phép frontend (các origin) kết nối khi dev trên ports khác nhau.
  cors: { 
    origin: [
      'http://localhost:5173',
      'http://localhost:3000', 
      'http://localhost:4173',
    ],
    credentials: true 
  },
})

export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  //instance socket.io để broadcast, join rooms, v.v
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private jwtService: JwtService,
    private chatService: WebSocketService,
    private config: ConfigService,
  ) {}

  private parseCookie(cookieHeader?: string | null) {
    if (!cookieHeader) return {};
    return cookieHeader
      .split(';')
      .map(c => c.split('='))
      .reduce((acc, [k, ...v]) => {
        acc[k?.trim()] = decodeURIComponent((v || []).join('='));
        return acc;
      }, {} as Record<string, string>);
  }

  // handleConnection và handleDisconnect không do frontend gọi trực tiếp — NestJS + @WebSocketGateway tự gọi những hàm đó khi client kết nối hoặc mất kết nối. 
  // Những hàm @SubscribeMessage(...) (ví dụ handleJoinConversation, handleSendMessage) được gọi khi client socket.emit('joinConversation', ...) hoặc socket.emit('sendMessage', ...)

  // handleConnection xác thực token, gán client.data.user, auto-join các conversation của user (client.join(roomId)), rồi emit connected về client.
  async handleConnection(client: Socket) {
    try {
      this.logger.log(`🔌 Connection attempt from ${client.id}`);
      
      // Lấy token từ client.handshake.auth?.token (khi client truyền token qua auth khi connect)
      // lấy token để biết ai đang connect, quyền hay không, đang chat với ai, đảm bảo 2 người nhận message
      // vì không có Authorization header như http nên phải gửi qua handshake
      let token = client.handshake.auth?.token as string | undefined;

      if (!token) {
        const cookieHeader = (client.handshake.headers?.cookie as string) || '';
        const cookies = this.parseCookie(cookieHeader);
        token = cookies['Authentication'] ?? cookies['authentication'] ?? undefined;
      }

      if (!token) {
        this.logger.warn(`❌ Socket without token tried to connect: ${client.id}`);
        client.emit('error', 'No auth token');
        client.disconnect(true);
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });

      // đảm bảo token này chỉ dành cho socket
      if (payload.scope !== 'socket') {
        this.logger.warn(`❌ Invalid token scope for socket ${client.id}`);
        throw new UnauthorizedException('Invalid token scope');
      }

      // gán thông tin được decode từ token
      const userId = payload.sub;
      client.data.user = { id: userId, username: payload.username };

      this.logger.log(`✅ User connected: ${client.data.user.username} (${client.id})`);

      // Auto-join all conversations
      try {
        // lấy danh sách conversation user tham gia
        const convs = await this.chatService.getUserConversations(userId);
        convs.forEach((c) => {
          // với mỗi conversation để client tự động ở trong những room đó ngay khi kết nối (giúp nhận message luôn)
          client.join(c.id);
        });
        this.logger.log(`✅ Auto-joined ${convs.length} conversations for user ${userId}`);
      } catch (e) {
        this.logger.warn(`⚠️ Failed to auto-join conversations: ${e?.message || e}`);
      }

      // Emit success event
      client.emit('connected', { 
        success: true, 
        userId,
        username: client.data.user.username 
      });

    } catch (err) {
      this.logger.error(`❌ Socket auth failed: ${err?.message || err}`);
      client.emit('error', err?.message || 'Auth failed');
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`❌ Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: string }, 
    @ConnectedSocket() client: Socket
  ) {
    const { conversationId } = data;
    const userId = client.data.user?.id;
    
    if (!userId) {
      client.emit('error', 'User not authenticated');
      return;
    }

    try {
      // Validate user is participant
      const isParticipant = await this.chatService.isUserInConversation(conversationId, userId);
      if (!isParticipant) {
        this.logger.warn(`⚠️ User ${userId} tried to join unauthorized conversation ${conversationId}`);
        client.emit('error', 'Not authorized for this conversation');
        return;
      }

      client.join(conversationId);
      this.logger.log(`✅ User ${userId} joined conversation ${conversationId}`);
      client.emit('joined', { conversationId });
    } catch (error) {
      this.logger.error(`❌ Error joining conversation: ${error?.message || error}`);
      client.emit('error', 'Failed to join conversation');
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { conversationId: string; content: string }, 
    @ConnectedSocket() client: Socket
  ) {
    const user = client.data.user;
    if (!user) {
      client.emit('error', 'User not authenticated');
      return;
    }
    
    const { conversationId, content } = data;

    if (!content?.trim()) {
      client.emit('error', 'Message content cannot be empty');
      return;
    }

    try {
      // ✅ CRITICAL FIX: Persist message to database with full sender info
      const message = await this.chatService.addMessage(
        conversationId, 
        user.id, 
        content.trim()
      );

      // Update conversation timestamp
      await this.chatService.touchConversation(conversationId);

      // Sau khi message đã được lưu vào database, 
      // server phải thông báo (notify) mọi client hiện đang tham gia conversation đó. 
      // Đoạn code này làm đúng việc đó: gửi (broadcast) một sự kiện tên 'message' tới tất cả socket đã join room có id = conversationId
      this.server.to(conversationId).emit('message', {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        read: message.read,
        sender: {
          id: message.sender.id,
          username: message.sender.username,
          email: message.sender.email,
          avatar: message.sender.avatar,
        },
      });

      this.logger.log(`📨 Message sent in conversation ${conversationId} by ${user.username}`);
    } catch (error) {
      this.logger.error(`❌ Error sending message: ${error?.message || error}`);
      client.emit('error', 'Failed to send message');
    }
  }
}