import { Field, ObjectType } from '@nestjs/graphql';
import { TagReturn } from './tag.model';

@ObjectType()
export class TagReponse {
    @Field()
    success: boolean;

    @Field({ nullable: true })
    message?: string;

    @Field(() => [TagReturn], { nullable: true })
    tags?: TagReturn[];
}
