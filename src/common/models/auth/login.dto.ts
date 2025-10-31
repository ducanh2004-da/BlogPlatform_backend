import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsEmail, Length } from 'class-validator';
@InputType()
export class LoginDto{
    @Field(() => String)
    @IsEmail({}, { message: 'Email is invalid' })
    email: string;

    @Field(() => String)
    @Length(5, 100, {message: 'password at least 5 character'})
    password: string;
}