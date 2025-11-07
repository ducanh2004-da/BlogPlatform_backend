import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsEmail, IsString, Length, Matches, IsOptional, IsEnum } from 'class-validator';

@ObjectType()
export class TagReturn {
    @Field()
    id: string;

    @Field()
    name: string;

    @Field()
    createdAt: Date;
}

@InputType()
export class CreateTag{
    @Field(() => String)
    @IsString({message: 'Name must be string'})
    @Length(2,30, {message: 'Name must between 2 to 30 character'})
    name: string;
}

@InputType()
export class UpdateTag{
    @Field(() => String)
    @IsString({message: 'Name must be string'})
    @Length(2,30, {message: 'Name must between 2 to 30 character'})
    name: string;
}