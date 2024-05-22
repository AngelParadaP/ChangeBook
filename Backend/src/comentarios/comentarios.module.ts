import { Module } from '@nestjs/common';
import { ComentariosService } from './comentarios.service';
import { ComentariosController } from './comentarios.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comentario } from './entities/comentario.entity';
import { Book } from 'src/books/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Comentario, Book])],
  exports: [TypeOrmModule, ComentariosService],
  controllers: [ComentariosController],
  providers: [ComentariosService],
})
export class ComentariosModule {}
