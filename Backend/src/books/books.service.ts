import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Book } from './entities/book.entity';
import { ILike, Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { UploadService } from 'src/upload/upload.service';
import { ImageTitleDto } from './dto/image-title.dto';
import { WishlistService } from 'src/wishlist/wishlist.service';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book) private bookRepository: Repository<Book>,
    private userService: UsersService,
    private readonly uploadService: UploadService,
    private readonly wishlistService: WishlistService,
  ) {}

  async create(file: Express.Multer.File, createBookDto: CreateBookDto) {
    try {
      const user = await this.userService.findOne(createBookDto.codigo);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const { titulo, codigo } = createBookDto;

      const tituloCreator: ImageTitleDto = {
        titulo,
        codigo,
      };

      const url = await this.uploadService.upload(tituloCreator, file.buffer);

      // Crea un nuevo libro y asigna el usuario
      const book = new Book();
      book.titulo = createBookDto.titulo;
      book.editorial = createBookDto.editorial;
      book.autor = createBookDto.autor;
      book.sinopsis = createBookDto.sinopsis;
      book.isbn = createBookDto.isbn;
      book.ano_de_publicacion = createBookDto.ano_de_publicacion;
      book.user = user;
      book.imagen = url;

      // Guarda el libro en la base de datos
      return await this.bookRepository.save(book);
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      // De lo contrario, lanza una InternalServerErrorException con un mensaje de error genérico
      throw new InternalServerErrorException(
        'Server failed to retrieve books',
        err,
      );
    }
  }

  async findAll() {
    try {
      const books = await this.bookRepository.find({
        relations: {
          user: true,
        },
      });
      if (!books || books.length === 0) {
        throw new NotFoundException('No books found in database');
      }
      return books;
    } catch (err) {
      // Si se trata de una NotFoundException lanzada dentro del bloque try, simplemente relanza la excepción
      if (err instanceof NotFoundException) {
        throw err;
      }
      // De lo contrario, lanza una InternalServerErrorException con un mensaje de error genérico
      throw new InternalServerErrorException(
        'Server failed to retrieve books',
        err,
      );
    }
  }

  async findUserBooks(codigo: string) {
    const user = await this.userService.findOne(codigo);
    if (user) {
      try {
        const books =
          (await this.bookRepository.find({
            where: {
              user: {
                codigo,
              },
            },
          })) || [];
        if (!books || books.length === 0) {
          throw new NotFoundException(
            'No books of this user found in database',
          );
        }
        return books;
      } catch (err) {
        throw new InternalServerErrorException(
          'Server failed to retrieve user books',
          err,
        );
      }
    }
  }

  async update(
    idLibro: string,
    updateBookDto: UpdateBookDto,
  ): Promise<Book | null> {
    try {
      const libroExistente = await this.bookRepository.findOne({
        where: {
          idLibro,
        },
      });
      if (!libroExistente) {
        throw new NotFoundException('Book not found');
      }

      if (
        libroExistente.disponible === false &&
        updateBookDto.disponible === true
      ) {
        await this.wishlistService.sendWishListNoti(idLibro);
      }

      // Actualiza las propiedades del libro con los datos proporcionados
      this.bookRepository.merge(libroExistente, updateBookDto);
      return await this.bookRepository.save(libroExistente);
    } catch (err) {
      throw new InternalServerErrorException(
        'Server failed to update book',
        err,
      );
    }
  }

  async remove(idLibro: string) {
    try {
      const book = await this.bookRepository.findOne({
        where: {
          idLibro,
        },
      });
      if (!book) {
        throw new NotFoundException('No books found in database');
      }

      await this.bookRepository.remove(book);

      return book;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      // De lo contrario, lanza una InternalServerErrorException con un mensaje de error genérico
      throw new InternalServerErrorException(
        'Server failed to retrieve books',
        err,
      );
    }
  }

  async sumarIntercambio(idLibro: string): Promise<Book | null> {
    try {
      const libroExistente = await this.bookRepository.findOne({
        where: {
          idLibro,
        },
      });
      if (!libroExistente) {
        throw new NotFoundException('Book not found in database');
      }
      libroExistente.intercambios++; // Aumenta en 1 el número de intercambios
      return await this.bookRepository.save(libroExistente);
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      // De lo contrario, lanza una InternalServerErrorException con un mensaje de error genérico
      throw new InternalServerErrorException(
        'Server failed to retrieve books',
        err,
      );
    }
  }

  async getBooksByTitle(cadena: string): Promise<Book[]> {
    try {
      const books = await this.bookRepository.find({
        where: {
          titulo: ILike(`%${cadena}%`), // Busca el título que contenga la cadena, ignorando mayúsculas y minúsculas
        },
        relations: {
          user: true,
        },
      });
      if (!books || books.length === 0) {
        throw new NotFoundException('No books found with the provided title');
      }
      return books;
    } catch (err) {
      throw new NotFoundException('No books found with the provided title');
    }
  }

  async getBooksById(cadena: string): Promise<Book[]> {
    try {
      const books = await this.bookRepository.find({
        where: {
          idLibro: cadena, // Busca el título que contenga la cadena, ignorando mayúsculas y minúsculas
        },
        relations: {
          user: true,
        },
      });
      if (!books || books.length === 0) {
        throw new NotFoundException('No books found with the provided title');
      }
      return books;
    } catch (err) {
      throw new NotFoundException('No books found with the provided title');
    }
  }
}