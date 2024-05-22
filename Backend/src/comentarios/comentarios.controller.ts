import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ComentariosService } from './comentarios.service';
import { CreateComentarioDto } from './dto/create-comentario.dto';

@Controller('comentarios')
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  @Post()
  create(@Body() createComentarioDto: CreateComentarioDto): Promise<any> {
    return this.comentariosService.create(createComentarioDto);
  }

  @Get('/get/:idLibro')
  getCommentsFromABook(@Param('idLibro') idLibro: string): Promise<any> {
    return this.comentariosService.getBooksComment(idLibro);
  }
}
