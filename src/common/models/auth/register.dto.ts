import { Field, ObjectType, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, Length, Matches, IsOptional, IsEnum } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';

@InputType()
export class RegisterDto{
    @Field(() => String)
    @IsString()
    @Length(3,30, {message: 'username must between 3 to 30 character'})
    username: string;

    @Field(() => String)
    @IsEmail({}, {message: 'email is invalid'})
    email: string;

    @Field(() => String)
    @IsString()
    @Length(5, 100, {message: 'Password must at least 5 character'})
    password: string;

    @Field(() => String)
    @IsString()
    @IsOptional()
    address: string;

    @Field(() => String)
    @Matches(/^[0-9]{9,15}$/, { message: 'phone number is invalid' })
    phoneNumber: string;

    @Field(() => String)
    @IsOptional()
    @IsEnum(Role, { message: 'role is invalid' })
    role: string = Role.SUBCRIBER;
}