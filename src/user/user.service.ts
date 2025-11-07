import { Injectable } from '@nestjs/common';
import { UserResponse, UserReturn } from 'src/common/models/user';
import { PrismaService } from 'src/prisma/prisma.service';
import { IUserService } from './user.interface';

@Injectable()
export class UserService implements IUserService {
    constructor(private prisma: PrismaService) { }
    async getUserById(userId: string): Promise<UserReturn> {
        const user = await this.prisma.user.findFirst({
            where: {
                id: userId
            }
        });
        if (!user) {
            return {
                message: 'User not found',
                data: null
            }
        }
        return {
            message: '',
            data: user
        };
    }
}
