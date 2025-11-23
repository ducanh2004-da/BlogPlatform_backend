import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Middleware
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://blog-frontend-ebon-theta.vercel.app',
      'https://blogplatform-backend-2ikg.onrender.com',
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, Cookie',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  console.log('');
  console.log('='.repeat(50));
  console.log(`🚀 Server is running`);
  console.log(`📍 HTTP: http://localhost:${port}`);
  console.log(`📍 GraphQL: http://localhost:${port}/graphql`);
  console.log(`🔌 WebSocket: http://localhost:${port}/chat`);
  console.log('='.repeat(50));
  console.log('');
}
bootstrap();