import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';
import { IUserService, USER_TOKEN } from './user.interface';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
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
      provide: USER_TOKEN,
      useClass: UserService
    }
    , UserResolver
  ],
  exports: [USER_TOKEN]
})
export class UserModule {}
