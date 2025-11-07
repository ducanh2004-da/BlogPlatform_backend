import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1) Middleware trước tất cả
  app.use(cookieParser());

  // 2) Enable CORS trước khi app.listen()
  // Nếu chỉ dev: bạn có thể set origin: true
  // Nếu production: dùng danh sách whitelist (khuyến nghị)
  app.enableCors({
    origin: ['http://localhost:5173'], // <- client origin (vite)
    credentials: true,                  // RẤT QUAN TRỌNG: cho phép cookie
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, Cookie',
    // exposedHeaders: 'Set-Cookie' // không cần thiết, browser tự xử lý cookie
  });

  // 3) Bắt đầu nghe (sau khi đã cấu hình middleware & CORS)
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Server listening at http://localhost:${port}`);
}
bootstrap();
