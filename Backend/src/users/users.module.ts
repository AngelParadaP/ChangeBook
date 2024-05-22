import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities';
import { Credenciales } from 'src/credenciales/entities';
import { Book } from 'src/books/entities/book.entity';
import { UploadService } from 'src/upload/upload.service';
import { CredencialesModule } from 'src/credenciales/credenciales.module';
import { BooksModule } from 'src/books/books.module';
import { Wishlist } from 'src/wishlist/entities/wishlist.entity';
import { WishlistModule } from 'src/wishlist/wishlist.module';
import { Notification } from 'src/notificaciones/entities/notificaciones.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Credenciales,
      Book,
      Wishlist,
      Notification,
    ]),
    BooksModule,
    CredencialesModule,
    WishlistModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UploadService],
  exports: [UsersModule, UsersService],
})
export class UsersModule {}
