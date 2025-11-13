import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { UserResponse } from '../user';

@ObjectType()
export class LikeReturn {
    @Field()
    id: string;

    @Field()
    blogId: string;

    @Field(() => UserResponse)
    user: UserResponse;

    @Field()
    createdAt: Date;
}