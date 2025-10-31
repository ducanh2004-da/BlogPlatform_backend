import { Field, ObjectType } from '@nestjs/graphql';
import { IsEmail, IsString } from 'class-validator';
@ObjectType()
export class GoogleDto{
    @Field(() => String)
    @IsEmail({}, { message: 'email is invalid' })
    email: string;

    @Field(() => String)
    @IsString()
    googleId: string;
}