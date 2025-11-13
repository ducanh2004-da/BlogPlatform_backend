import { Args, Mutation, Resolver, Query, Context } from '@nestjs/graphql';
import { IAuthService, AUTH_TOKEN } from './auth.interface';
import { AuthResponse, LoginDto, RegisterDto, TokenDto, GoogleDto, GenericResponse } from 'src/common/models/auth';
import { Inject, UseGuards } from '@nestjs/common';
import { AuthGuard, RoleGuard } from 'src/common/guards/auth.guard';
import { Roles } from 'src/common/decorators/role.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

// resolver xử lý các request liên quan đến auth
@Resolver(() => AuthResponse)
export class AuthResolver {
    constructor(@Inject(AUTH_TOKEN) private readonly authService: IAuthService) { }

    @Mutation(() => GenericResponse)
    async register(@Args('data') data: RegisterDto, @Context() ctx: any): Promise<GenericResponse | null> {
        const user = await this.authService.register(data);
        if (user?.success && user.refreshToken && user.accessToken) {
            this.setAuthCookies(ctx.res, user.accessToken, user.refreshToken);
        }
        return {
            success: user.success,
            message: user.message
        };
    }

    @Mutation(() => AuthResponse)
    async login(@Args('data') data: LoginDto, @Context() ctx: any): Promise<AuthResponse | null> {
        const user = await this.authService.login(data);
        if (user?.success && user.accessToken && user.refreshToken) {
            this.setAuthCookies(ctx.res, user.accessToken, user.refreshToken);
            return {
                success: true,
                message: '',
                accessToken: user.accessToken,
                refreshToken: user.refreshToken
            };
        } else {
            return {
                success: false,
                message: user?.message || 'Login failed',
                accessToken: undefined,
                refreshToken: undefined
            }
        }
    }

    @Mutation(() => GenericResponse)
    async refresh(@Context() ctx: any): Promise<GenericResponse> {
        const refreshToken = ctx.req.cookies?.Refresh;
        
        if (!refreshToken) {
            return { 
                success: false, 
                message: 'No refresh token provided' 
            };
        }

        try {
            const { accessToken, refreshToken: newRefreshToken } = 
                await this.authService.refreshTokens(refreshToken);
            
            this.setAuthCookies(ctx.res, accessToken, newRefreshToken);

            return { 
                success: true, 
                message: 'Tokens refreshed successfully' 
            };
        } catch (error) {
            this.clearAuthCookies(ctx.res);
            return { 
                success: false, 
                message: 'Token refresh failed' 
            };
        }
    }

    @Mutation(() => GenericResponse)
    @UseGuards(AuthGuard)
    async logout(@Context() ctx: any) {
        const logoutResult = await this.authService.logout(ctx);
        await this.clearAuthCookies(ctx.res);
        if(!logoutResult){
            return{
                success: false,
                message: 'Log out failed'
            }
        }
        return { success: true, message: 'Logged out' };
    }

    @Mutation(() => AuthResponse)
    async googleLogin(@Args('idToken') idToken: string): Promise<AuthResponse | null> {
        const user = await this.authService.GoogleLogin(idToken);
        if (!user) {
            return null
        }
        return user;
    }

    @Query(() => String)
    @UseGuards(AuthGuard)
    @Roles('SUBSCRIBER')
    helloUser(@CurrentUser() user: any) {
        return `Hello ${user.username}`;
    }

    @Query(() => String)
    @UseGuards(AuthGuard)
    @Roles('ADMIN')
    helloAdmin(@CurrentUser() user: any) {
        return `Hello ${user.username}`;
    }

    private setAuthCookies(res: any, accessToken: string, refreshToken: string) {
        const isProduction = process.env.NODE_ENV === 'production';
        // Access Token - 15 minutes
        res.cookie('Authentication', accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            path: '/',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        // Refresh Token - 7 days
        res.cookie('Refresh', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
    }

    private clearAuthCookies(res: any): void {
        res.clearCookie('Authentication', { path: '/' });
        res.clearCookie('Refresh', { path: '/' });
    }
}
