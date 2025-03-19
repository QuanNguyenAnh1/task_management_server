import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Cấu hình CORS
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
    credentials: true,
    maxAge: 3600,
  });
  
  // Cấu hình JSON parser
  app.use(json({ limit: '50mb' }));
  
  // Cấu hình validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại bỏ các thuộc tính không được khai báo trong DTO
      transform: true, // Tự động chuyển đổi kiểu dữ liệu
      forbidNonWhitelisted: false, // Thay đổi thành false để không báo lỗi khi có thuộc tính không được khai báo
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  
  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('Task Manager API')
    .setDescription('API documentation for Task Manager application')
    .setVersion('1.0')
    .addTag('tasks')
    .addTag('auth')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation is available at: http://localhost:${port}/api`);
}
bootstrap();