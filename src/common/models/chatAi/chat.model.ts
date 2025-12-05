import { Field, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class ChatAiResponse {
  @Field()
  text: string;

  // raw có thể là object, dùng JSON scalar
  @Field(() => GraphQLJSON, { nullable: true })
  raw: any;
}

@ObjectType()
export class NltoSQL {
  // rows là mảng object động => mảng JSON
  // nullable: 'itemsAndList' cho phép list và item đều nullable (tuỳ phiên bản Nest)
  @Field(() => [GraphQLJSON], { nullable: 'itemsAndList' })
  rows: any[];

  // spec có thể là object hoặc string -> dùng JSON scalar
  @Field(() => GraphQLJSON, { nullable: true })
  spec: any;

  // raw từ model API
  @Field(() => GraphQLJSON, { nullable: true })
  raw: any;
}
