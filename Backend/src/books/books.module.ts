import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities';
import { Book } from './entities/book.entity';
import { UsersService } from 'src/users/users.service';
import { UploadService } from 'src/upload/upload.service';
import { CredencialesService } from 'src/credenciales/credenciales.service';
import { CredencialesModule } from 'src/credenciales/credenciales.module';
import { Comentario } from 'src/comentarios/entities/comentario.entity';
import { Wishlist } from 'src/wishlist/entities/wishlist.entity';
import { WishlistModule } from 'src/wishlist/wishlist.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Book, Wishlist, Comentario]),
    CredencialesModule,
    WishlistModule,

  ],
  controllers: [BooksController],

  providers: [BooksService, UsersService, UploadService, CredencialesService],
  exports: [],
})
export class BooksModule {}