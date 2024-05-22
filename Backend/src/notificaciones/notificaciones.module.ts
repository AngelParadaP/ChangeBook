import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notificaciones.entity';
import { NotificacionesController } from './notificaciones.controller';
import { NotificacionesService } from './notificaciones.service';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities';
import { Book } from 'src/books/entities';
import { UploadService } from 'src/upload/upload.service';
import { Credenciales } from 'src/credenciales/entities';
import { CredencialesService } from 'src/credenciales/credenciales.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User, Book, Credenciales]),
    NotificacionesModule,
  ],
  exports: [TypeOrmModule],
  controllers: [NotificacionesController],
  providers: [
    NotificacionesService,
    UsersService,
    UploadService,
    CredencialesService,
  ],
})
export class NotificacionesModule {}
