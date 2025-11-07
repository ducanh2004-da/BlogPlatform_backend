import { Field, ObjectType } from '@nestjs/graphql';
import { UserResponse } from './user.response';
import { User } from '@prisma/client';

@ObjectType()
export class UserReturn {
    @Field(() => String, { nullable: true })
    message?: string;

    @Field(() => UserResponse, { nullable: true })
    data: UserResponse | null;

}
