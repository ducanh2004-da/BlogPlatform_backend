import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CreateResponse {
    @Field()
    success: boolean;

    @Field({ nullable: true })
    message?: string;
}
