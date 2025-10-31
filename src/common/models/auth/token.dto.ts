import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TokenDto{
    @Field(() => Boolean)
    userId: boolean;

    @Field(() => String, {nullable: true})
    email: string;

    @Field(() => String, {nullable: true})
    userName: string;

    @Field(() => String, {nullable: true})
    role: string;
}