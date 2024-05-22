import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 2097152 })],
      }),
    )
    file: Express.Multer.File,
    @Body() createBookDto: CreateBookDto,
  ) {
    return this.booksService.create(file, createBookDto);
  }

  @Get()
  findAll() {
    return this.booksService.findAll();
  }

  @Get('for/:codigo')
  findBooksFor(@Param('codigo') codigo: string) {
    return this.booksService.findUserBooks(codigo);
  }

  @Patch(':idLibro')
  update(
    @Param('idLibro') idLibro: string,
    @Body() updateBookDto: UpdateBookDto,
  ) {
    return this.booksService.update(idLibro, updateBookDto);
  }

  @Delete(':idLibro')
  remove(@Param('idLibro') idLibro: string) {
    return this.booksService.remove(idLibro);
  }

  @Post('/sumarIntercambio/:idLibro')
  sumarIntercambio(@Param('idLibro') idLibro: string) {
    return this.booksService.sumarIntercambio(idLibro);
  }

  @Get('/byTitle/:cadena')
  getBooksByTitle(@Param('cadena') cadena: string) {
    return this.booksService.getBooksByTitle(cadena);
  }
  @Get('/byId/:cadena')
  getBooksById(@Param('cadena') cadena: string) {
    return this.booksService.getBooksById(cadena);
  }
}