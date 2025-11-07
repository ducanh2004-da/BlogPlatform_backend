import { Field, ObjectType } from '@nestjs/graphql';
import { BlogReturn } from './blog.model';

@ObjectType()
export class BlogResponse {
    @Field()
    success: boolean;

    @Field({ nullable: true })
    message?: string;

    @Field(() => [BlogReturn], { nullable: true })
    blogs?: BlogReturn[];
}
