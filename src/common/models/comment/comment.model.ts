import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsEmail, IsString, Length, Matches, IsOptional, IsEnum } from 'class-validator';
import { UserResponse } from '../user';

@ObjectType()
export class CommentReturn {
    @Field()
    id: string;

    @Field()
    content: string;

    @Field(() => UserResponse)
    user: UserResponse;

    @Field()
    createdAt: Date;
}

@InputType()
export class CreateComment{
    @Field(() => String)
    @IsString({message: 'Content must be string'})
    @Length(1,500, {message: 'Content must between 1 to 500 character'})
    content: string;

    @Field(() => String)
    @IsString({message: 'BlogId must be string'})
    blogId: string;

    @Field(() => String)
    @IsString({message: 'UserId must be string'})
    userId: string;
}

@InputType()
export class UpdateComment{
    @Field(() => String)
    @IsString({message: 'Content must be string'})
    @Length(1,500, {message: 'Content must between 1 to 500 character'})
    content: string;

    @Field(() => String)
    @IsString({message: 'BlogId must be string'})
    blogId: string;

    @Field(() => String)
    @IsString({message: 'UserId must be string'})
    userId: string;
}