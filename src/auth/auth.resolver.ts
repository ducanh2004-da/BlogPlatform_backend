import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { IAuthService, AUTH_TOKEN } from './auth.interface';
import { AuthResponse, LoginDto, RegisterDto, TokenDto, GoogleDto } from 'src/common/models/auth';
import { Inject, UseGuards } from '@nestjs/common';
import { AuthGuard, RoleGuard } from 'src/common/guards/auth.guard';
import { Roles } from 'src/common/decorators/role.decorator';

@Resolver(() => AuthResponse)
export class AuthResolver {
    constructor(@Inject(AUTH_TOKEN) private readonly authService: IAuthService){}

    @Mutation(() => AuthResponse)
    async register(@Args('data') data: RegisterDto): Promise<AuthResponse | null>{
        const user = await this.authService.register(data);
        if(!user){
            return null
        }
        return user;
    }

    @Mutation(() => AuthResponse)
    async login(@Args('data') data: LoginDto): Promise<AuthResponse | null>{
        const user = await this.authService.login(data);
        if(!user){
            return null
        }
        return user;
    }

    @Mutation(() => AuthResponse)
    async googleLogin(@Args('idToken') idToken: string): Promise<AuthResponse | null>{
        const user = await this.authService.GoogleLogin(idToken);
        if(!user){
            return null
        }
        return user;
    }

    @Query(() => String)
    @UseGuards(AuthGuard)
    @Roles('SUBSCRIBER')
    helloUser(){
        return "Hello user";
    }

    @Query(() => String)
    @UseGuards(AuthGuard)
    @Roles('ADMIN')
    helloAdmin(){
        return "Hello admin";
    }
}
