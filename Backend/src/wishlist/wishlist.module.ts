import { Module } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { Book } from 'src/books/entities';
import { Notification } from 'src/notificaciones/entities/notificaciones.entity';
import { NotificacionesService } from 'src/notificaciones/notificaciones.service';
import { UsersService } from 'src/users/users.service';
import { UsersModule } from 'src/users/users.module';
import { NotificacionesModule } from 'src/notificaciones/notificaciones.module';
import { User } from 'src/users/entities';
import { Credenciales } from 'src/credenciales/entities';
import { UploadService } from 'src/upload/upload.service';
import { CredencialesService } from 'src/credenciales/credenciales.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wishlist,
      Book,
      Notification,
      User,
      Credenciales,
    ]),
  ],
  controllers: [WishlistController],
  providers: [
    WishlistService,
    NotificacionesService,
    UsersService,
    UploadService,
    CredencialesService,
  ],
  exports: [TypeOrmModule, WishlistService],
})
export class WishlistModule {}
