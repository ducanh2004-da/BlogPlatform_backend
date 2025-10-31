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
                    token: undefined
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
            const token = await this.signToken(user.id, user.email, user.username, user.role);
            return {
                success: true,
                message: message,
                token
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
                    token: undefined
                }
            }
            const token = await this.signToken(existingUser.id, existingUser.email, existingUser.username, existingUser.role);
            return {
                success: true,
                message: message,
                token
            }
        } catch (ex) {
            message = ex;
            return {
                success: false,
                message: message,
                token: undefined
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
                    token: undefined
                }
            }
            const userGG = await this.verifyGoogleToken(idToken);
            if (!userGG) {
                message = "Can't find user";
                return {
                    success: false,
                    message: message,
                    token: undefined
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
            const token = await this.signToken(existingUser.id, existingUser?.email, existingUser?.username, existingUser?.role);
            return {
                success: true,
                message: message,
                token
            }
        } catch (ex) {
            message = ex;
            return {
                success: false,
                message: message,
                token: undefined
            }
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
    async signToken(userId: string, email: string, userName: string, role: string) {
        const payload = {
            userId,
            email,
            userName,
            role
        }
        const secret = this.config.get('JWT_SECRET');
        const token = await this.jwt.signAsync(payload);
        return token;
    }
}
