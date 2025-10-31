import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
  async cleanDb() {
    return this.$transaction([
      this.user.deleteMany(),
      this.blog.deleteMany(),
      this.comment.deleteMany(),
      this.tag.deleteMany(),
    ])
  }
}
