// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';
import { IAuthService, AUTH_TOKEN } from './auth.interface';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from 'src/common/strategy/google.strategy';
import { OAuth2Client } from 'google-auth-library';

@Module({
  imports: [
    PrismaModule,
    // nếu bạn đã cấu hình ConfigModule.forRoot({ isGlobal: true }) trong AppModule, vẫn an toàn để import lại
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // đăng ký async để lấy secret từ ConfigService; global:true để không cần import JwtModule ở nhiều module
      useFactory: async (configService: ConfigService) => {
        // ưu tiên tên biến JWT_ACCESS_SECRET để nhất quán với AuthGuard đã dùng trước đó
        const secret = configService.get<string>('JWT_ACCESS_SECRET') || configService.get<string>('JWT_SECRET');
        if (!secret) {
          // fail-fast: nếu thiếu biến môi trường thì rõ ràng báo lỗi khi app khởi động
          throw new Error('JWT_ACCESS_SECRET (or JWT_SECRET) is not set in environment variables');
        }
        return {
          secret,
          signOptions: { expiresIn: '12h' }, // bạn có thể thay đổi theo nhu cầu
        };
      },
      global: true,
    }),
  ],
  providers: [
    AuthService, // để Nest có thể instantiate AuthService khi dùng useClass
    {
      provide: AUTH_TOKEN,
      useClass: AuthService,
    },
    {
      provide: 'OAUTH2_CLIENT',
      useFactory: (config: ConfigService) => {
        const clientId = config.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET');
        const redirectUri = config.get<string>('GOOGLE_REDIRECT_URI'); // optional
        return new OAuth2Client(clientId, clientSecret, redirectUri);
      },
      inject: [ConfigService],
    },
    AuthResolver,
    GoogleStrategy,
  ],
  exports: [AUTH_TOKEN, JwtModule, PassportModule],
})
export class AuthModule {}
