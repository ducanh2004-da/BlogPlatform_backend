import { User } from '@prisma/client';
import { RegisterDto, AuthResponse, LoginDto, GoogleDto } from 'src/common/models/auth';
export interface IAuthService {
    register(data: RegisterDto): Promise<AuthResponse>
    login(data: LoginDto): Promise<AuthResponse>
    GoogleLogin(idToken: string): Promise<AuthResponse>
    refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>
    logout(context): Promise<boolean>
}
export const AUTH_TOKEN = 'IAuthService';