import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserResponse {
  @Field()
  id: string;

  @Field()
  username: string;

  @Field()
  email: string;

  @Field(() => String, { nullable: true }) 
  phoneNumber?: string | null;

  @Field(() => String, { nullable: true }) 
  avatar?: string | null;

  @Field()
  role: string; 

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
