import { Field, ObjectType } from '@nestjs/graphql';
import { LikeReturn } from './like.model';

@ObjectType()
export class LikeResponse {
    @Field()
    success: boolean;

    @Field({ nullable: true })
    message?: string;

    @Field()
    count?: number;

    @Field(() => [LikeReturn], { nullable: true })
    likes?: LikeReturn[];
}
