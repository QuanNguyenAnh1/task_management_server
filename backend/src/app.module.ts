import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { User } from './entities/user.entity';
import { Task } from './entities/task.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '1433'),
      username: process.env.DB_USER || 'sa',
      password: process.env.DB_PASS || '555555',
      database: process.env.DB_NAME || 'TaskManagement',
      entities: [User, Task],
      synchronize: false,
      extra: {
        trustServerCertificate: true,
      },
    }),
    AuthModule,
    TasksModule,
  ],
})
export class AppModule {}