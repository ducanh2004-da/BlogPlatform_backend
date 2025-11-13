import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';
import { IAuthService, AUTH_TOKEN } from './auth.interface';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from 'src/common/strategy/google.strategy';
import { OAuth2Client } from 'google-auth-library';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '12h' },
      }),
      inject: [ConfigService],
    })
  ],
  providers: [
    {
      provide: AUTH_TOKEN,
      useClass: AuthService
    },
    {
      provide: 'OAUTH2_CLIENT',
      useFactory: (config: ConfigService) => {
        const clientId = config.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET');
        const redirectUri = config.get<string>('GOOGLE_REDIRECT_URI'); // nếu có
        return new OAuth2Client(clientId, clientSecret, redirectUri);
      },
      inject: [ConfigService],
    },
    AuthResolver,
    GoogleStrategy
  ],
  exports: [AUTH_TOKEN, JwtModule]
})
export class AuthModule { }
