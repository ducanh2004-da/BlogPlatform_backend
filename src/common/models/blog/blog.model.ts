import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsEmail, IsString, Length, Matches, IsOptional, IsEnum } from 'class-validator';
import { TagReturn } from '../tag/tag.model';
import { CommentReturn } from '../comment/comment.model';
import { UserResponse } from '../user';

@ObjectType()
export class BlogReturn {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  content: string;

  @Field(() => UserResponse)
  user: UserResponse;

  @Field(() => [TagReturn])
  tags: TagReturn[];

  @Field(() => [CommentReturn])
  comments: CommentReturn[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class CreateBlog {
  @Field(() => String)
  @IsString({ message: 'Title must be string' })
  @Length(5, 100, { message: 'Title must between 5 to 100 character' })
  title: string;

  @Field(() => String)
  @IsString({ message: 'Content must be string' })
  @Length(20, 5000, { message: 'Content must between 20 to 5000 character' })
  content: string;

  @Field(() => String)
  @IsString({ message: 'UserId must be string' })
  userId: string;

  @Field(() => String)
  @IsString({ message: 'Tag id must be string' })
  tagId: string;
}

@InputType()
export class UpdateBlog {
  @Field(() => String)
  @IsString({ message: 'Title must be string' })
  @Length(5, 100, { message: 'Title must between 5 to 100 character' })
  title: string;

  @Field(() => String)
  @IsString({ message: 'Content must be string' })
  @Length(20, 5000, { message: 'Content must between 20 to 5000 character' })
  content: string;

  @Field(() => String)
  @IsString({ message: 'Tag id must be string' })
  tagId: string;
}

