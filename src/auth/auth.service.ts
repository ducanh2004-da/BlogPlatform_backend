import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthResponse, GoogleDto, LoginDto, RegisterDto, TokenDto } from 'src/common/models/auth';
import { ConfigService } from '@nestjs/config';
import { Role } from 'src/common/enums/role.enum';
import { IAuthService } from './auth.interface';
import { OAuth2Client } from 'google-auth-library';

//service xử lý logic auth
@Injectable()
export class AuthService implements IAuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService,
        @Inject('OAUTH2_CLIENT') private readonly googleClient: OAuth2Client,
    ) {
        const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
        this.googleClient = new OAuth2Client(clientId);
    }

    async register(data: RegisterDto): Promise<AuthResponse> {
        let message = '';
        try {
            const existingUser = await this.prisma.user.findFirst({
                where: {
                    email: data.email
                }
            });
            if (existingUser) {
                message = "User is already exist";
                return {
                    success: false,
                    message: message,
                    accessToken: undefined,
                    refreshToken: undefined
                }
            }
            const hash = await bcrypt.hash(data.password, 10);
            const user = await this.prisma.user.create({
                data: {
                    username: data.username,
                    email: data.email,
                    password: hash,
                    address: data.address,
                    phoneNumber: data.phoneNumber,
                }
            })
            const { accessToken, refreshToken } = await this.signToken(user.id, user.email, user.username, user.role);
            await this.updateRefreshToken(user.id, refreshToken);
            return {
                success: true,
                message: message,
                accessToken,
                refreshToken
            }
        }
        catch (ex) {
            message = ex;
            throw new BadRequestException(ex);
        }
    }
    async login(data: LoginDto): Promise<AuthResponse> {
        let message = '';
        try {
            const existingUser = await this.prisma.user.findFirst({
                where: {
                    email: data.email
                }
            });
            if (!existingUser) {
                message = "User not exist";
                return {
                    success: false,
                    message: message,
                    accessToken: undefined,
                    refreshToken: undefined
                }
            }
            const isCorrectPassword = await bcrypt
                .compare(data.password, existingUser.password)
                .catch(() => false);
            if (!isCorrectPassword) {
                message = "Incorrect password";
                return {
                    success: false,
                    message: message,
                    accessToken: undefined,
                    refreshToken: undefined
                }
            }
            const { accessToken, refreshToken } = await this.signToken(existingUser.id, existingUser.email, existingUser.username, existingUser.role);
            return {
                success: true,
                message: message,
                accessToken,
                refreshToken
            }
        } catch (ex) {
            message = ex;
            return {
                success: false,
                message: message,
                accessToken: undefined,
                refreshToken: undefined
            }
        }
    }
    async GoogleLogin(idToken: string): Promise<AuthResponse> {
        let message = '';
        try {
            if (!idToken) {
                message = "idToken is required";
                return {
                    success: false,
                    message: message,
                    accessToken: undefined,
                    refreshToken: undefined
                }
            }
            const userGG = await this.verifyGoogleToken(idToken);
            if (!userGG) {
                message = "Can't find user";
                return {
                    success: false,
                    message: message,
                    accessToken: undefined,
                    refreshToken: undefined
                }
            }
            let existingUser = await this.prisma.user.findFirst({
                where: {
                    email: userGG.email
                }
            });
            if (!existingUser) {
                existingUser = await this.prisma.user.create({
                    data: {
                        email: userGG.email ?? '',
                        googleId: userGG.googleId ?? ''
                    }
                })
            }
            else if (existingUser && !existingUser.googleId) {
                existingUser = await this.prisma.user.update({
                    where: { email: userGG.email },
                    data: { googleId: userGG.googleId }
                });
            }
            const { accessToken, refreshToken } = await this.signToken(existingUser.id, existingUser?.email, existingUser?.username, existingUser?.role);
            return {
                success: true,
                message: message,
                accessToken,
                refreshToken
            }
        } catch (ex) {
            message = ex;
            return {
                success: false,
                message: message,
                accessToken: undefined,
                refreshToken: undefined
            }
        }
    }

    async logout(context): Promise<boolean> {
        if (
            !context ||
            !context.res ||
            typeof context.res.clearCookie !== 'function'
        ) {
            throw new UnauthorizedException('Logout failed: Invalid request context');
        }
        await this.prisma.user.update({
            where: { id: context.user?.sub },
            data: { hashedRefreshToken: null },
        });
        return true;
    }

    async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        try {
            // 1️⃣ Xác thực refresh token
            const payload = this.jwt.verify(refreshToken, {
                secret: this.config.get<string>('JWT_REFRESH_SECRET'),
            });

            if (!payload || !payload.sub) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // 2️⃣ Lấy user từ DB theo payload.sub
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            // 3️⃣ So sánh refresh token hash trong DB (nếu bạn lưu hash)
            if (user.hashedRefreshToken) {
                const isMatch = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
                if (!isMatch) throw new UnauthorizedException('Invalid refresh token');
            }

            // 4️⃣ Tạo accessToken và refreshToken mới
            const { accessToken, refreshToken: newRefreshToken } = await this.signToken(
                user.id,
                user.email,
                user.username,
                user.role
            );

            // 5️⃣ Hash refresh token mới để lưu vào DB
            await this.updateRefreshToken(user.id, newRefreshToken);

            // 6️⃣ Trả 2 token mới cho resolver
            return { accessToken, refreshToken: newRefreshToken };
        } catch (err) {
            console.error('Refresh token error:', err);
            throw new UnauthorizedException('Refresh token expired or invalid');
        }
    }

    async verifyGoogleToken(idToken: string) {
        const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
        if (!clientId) {
            throw new Error('Google Client ID is not set');
        }
        const ticket = await this.googleClient.verifyIdToken({
            idToken,
            audience: clientId
        });
        const payload = ticket.getPayload();
        if (!payload) {
            throw new UnauthorizedException('Invalid Google token');
        }
        return {
            googleId: payload['sub'],
            email: payload['email']
        };
    }
    private async updateRefreshToken(userId: string, refreshToken: string) {
        const hashRefreshToken = await bcrypt.hash(refreshToken, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { hashedRefreshToken: hashRefreshToken },
        });
    }
    private async signToken(userId: string, email: string, userName: string, role: string) {
        const payload = {
            sub: userId,
            email,
            userName,
            role
        }
        const accessToken = await this.jwt.signAsync(payload, {
            secret: this.config.get<string>('JWT_ACCESS_SECRET'),
            expiresIn: '15m',
        });
        const refreshToken = await this.jwt.signAsync(
            { sub: userId },
            {
                secret: this.config.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: '7d',
            },
        );
        return {
            accessToken,
            refreshToken
        }
    }
}
