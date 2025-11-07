import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthResponse{
    @Field(() => Boolean)
    success: boolean;

    @Field(() => String, {nullable: true})
    message?: string;

    @Field(() => String, {nullable: true})
    accessToken?: string;

    @Field(() => String, {nullable: true})
    refreshToken?: string;
}

@ObjectType()
export class GenericResponse {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;
}