// src/web-socket/web-socket.service.ts - FIXED VERSION
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WebSocketService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tìm hoặc tạo conversation giữa các users
   * - Với 2 users: tìm conversation 1-1 đã có, nếu không thì tạo mới
   * - Với >2 users: tạo group conversation
   */
  async createOrGetConversationBetween(userIds: string[], title?: string) {
    // Normalize unique ids
    const uniqueIds = Array.from(new Set(userIds));
    uniqueIds.sort(); // For deterministic comparison

    // For 1-1 conversations, check if already exists
    if (uniqueIds.length === 2) {
      // tìm conversation mà có ít nhất một participant có userId === uniqueIds[0] và không phải là nhóm
      const possible = await this.prisma.conversation.findMany({
        where: {
          isGroup: false,
          participants: { some: { userId: uniqueIds[0] } },
        },
        include: { 
          participants: { 
            include: { user: true } 
          } 
        },
        orderBy: { updatedAt: 'desc' },
      });

      // trả conversation mà có participantID của current user và user mà được chọn
      const found = possible.find((conv) => {
        const participantIds = conv.participants.map((p) => p.userId).sort();
        return (
          participantIds.length === 2 && 
          participantIds[0] === uniqueIds[0] && 
          participantIds[1] === uniqueIds[1]
        );
      });

      if (found) {
        return found;
      }
    }

    // nếu không có thì Create new conversation
    const conv = await this.prisma.conversation.create({
      data: {
        title,
        isGroup: uniqueIds.length > 2,
        participants: {
          create: uniqueIds.map((id) => ({ userId: id })),
        },
      },
      include: { 
        participants: { 
          include: { user: true } 
        } 
      },
    });

    return conv;
  }

  /**
   * ✅ CRITICAL FIX: Add message with full sender info
   */
  async addMessage(conversationId: string, senderId: string, content: string) {
    // Validate sender is participant
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { 
        conversationId_userId: { conversationId, userId: senderId } 
      },
    });
    
    if (!participant) {
      throw new ForbiddenException('Not part of conversation');
    }

    // Create message with full sender info
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
      },
      include: { 
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
            role: true,
          }
        } 
      },
    });

    return message;
  }

  /**
   * Update conversation's updatedAt timestamp
   */
  async touchConversation(conversationId: string) {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, take = 50, skip = 0) {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take,
      skip,
      include: { 
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
            role: true,
          }
        } 
      },
    });
    return messages;
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { 
        participants: { 
          some: { userId } 
        } 
      },
      include: { 
        participants: { 
          include: { 
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                role: true,
              }
            } 
          } 
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * ✅ NEW METHOD: Check if user is participant in conversation
   * This is called by chat.gateway.ts for authorization
   */
  async isUserInConversation(conversationId: string, userId: string): Promise<boolean> {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId }
      }
    });
    return !!participant;
  }

  /**
   * ✅ NEW METHOD: Get conversation by ID with full details
   */
  async getConversationById(conversationId: string) {
    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                role: true,
              }
            }
          }
        },
        messages: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
              }
            }
          }
        }
      }
    });
  }

  /**
   * ✅ NEW METHOD: Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, userId: string) {
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        read: false,
      },
      data: {
        read: true,
      },
    });
  }
}