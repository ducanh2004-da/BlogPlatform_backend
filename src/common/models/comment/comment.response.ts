import { Field, ObjectType } from '@nestjs/graphql';
import { CommentReturn } from './comment.model';

@ObjectType()
export class CommentResponse {
    @Field()
    success: boolean;

    @Field({ nullable: true })
    message?: string;

    @Field(() => [CommentReturn], { nullable: true })
    comments?: CommentReturn[];
}
