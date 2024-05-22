import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppService } from './app.service';
import { AppController } from './app.controller';

import { AuthModule } from 'src/auth/auth.module';
import { CredencialesModule } from 'src/credenciales/credenciales.module';
import { UsersModule } from 'src/users/users.module';
import { BooksModule } from 'src/books/books.module';
import { UploadModule } from 'src/upload/upload.module';
import { ChatModule } from 'src/chat/chat.module';
import { ReportesModule } from 'src/reportes/reportes.module';
import { ComentariosModule } from 'src/comentarios/comentarios.module';
import { NotificacionesModule } from 'src/notificaciones/notificaciones.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    AuthModule,
    CredencialesModule,
    UsersModule,
    BooksModule,
    UploadModule,
    ChatModule,
    ReportesModule,
    ComentariosModule,
    NotificacionesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}