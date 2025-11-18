import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { GraphQLISODateTime } from '@nestjs/graphql';
import { UserResponse } from '../user';
@ObjectType('ConversationParticipant')
export class ConversationParticipantType {
  @Field()
  id: string;

  @Field()
  conversationId: string;

  @Field()
  userId: string;

  // include user info when Prisma returns join include: { user: true }
  @Field(() => UserResponse, { nullable: true })
  user?: UserResponse;

  @Field(() => GraphQLISODateTime)
  joinedAt: Date;
}

@ObjectType('Message')
export class MessageType {
  @Field()
  id: string;

  @Field()
  conversationId: string;

  @Field()
  senderId: string;

  @Field()
  content: string;

  @Field()
  read: boolean;

  // optional: include sender data if you `include: { sender: true }` in Prisma query
  @Field(() => UserResponse, { nullable: true })
  sender?: UserResponse;

  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt: Date;
}

@ObjectType('Conversation')
export class ConversationType {
  @Field()
  id: string;

  @Field({ nullable: true })
  title?: string;

  @Field()
  isGroup: boolean;

  // participants array (usually returned with Prisma include)
  @Field(() => [ConversationParticipantType])
  participants: ConversationParticipantType[];

  // optionally include recent messages
  @Field(() => [MessageType], { nullable: true })
  messages?: MessageType[];

  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt: Date;
}