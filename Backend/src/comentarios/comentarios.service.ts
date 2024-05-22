import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { UpdateComentarioDto } from './dto/update-comentario.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Comentario } from './entities/comentario.entity';
import { Repository } from 'typeorm';
import { Book } from 'src/books/entities';

@Injectable()
export class ComentariosService {
  constructor(
    @InjectRepository(Comentario)
    private comentarioesRepository: Repository<Comentario>,
    @InjectRepository(Book)
    private libroRepository: Repository<Book>,
  ) {}

  async create(createComentarioDto: CreateComentarioDto): Promise<any> {
    const book: Book[] = await this.getBookById(createComentarioDto.idLibro);
    const payload = {
      comentario: createComentarioDto.comentario,
      book: book[0],
      calificacion: createComentarioDto.calificacion,
    };

    let sumaCalificaciones = createComentarioDto.calificacion;

    // Iterar sobre todos los comentarios para sumar las calificaciones
    book[0].coments.forEach((comentario) => {
      sumaCalificaciones += comentario.calificacion;
    });
    sumaCalificaciones /= book[0].coments.length + 1;
    book[0].calificacion = sumaCalificaciones;
    const nuevolibro = await this.libroRepository.save(book[0]);
    console.log(nuevolibro);

    const resp = this.comentarioesRepository.create(payload);
    return this.comentarioesRepository.save(resp);
  }

  async getBooksComment(id: string): Promise<any> {
    let calificacion = 0;

    const comments = await this.comentarioesRepository
      .createQueryBuilder('comentario')
      .innerJoinAndSelect('comentario.book', 'book')
      .where('book.idLibro = :idLibro', { idLibro: id })
      .select([
        'comentario.id',
        'comentario.comentario',
        'comentario.calificacion',
        'comentario.fecha',
      ])
      .getMany();

    comments.forEach((comment) => {
      calificacion += comment.calificacion;
    });

    calificacion /= comments.length;

    return { comments, calificacion };
  }

  async getBookById(cadena: string): Promise<Book[]> {
    try {
      const books = await this.libroRepository.find({
        where: {
          idLibro: cadena, // Busca el título que contenga la cadena, ignorando mayúsculas y minúsculas
        },
        relations: {
          coments: true,
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

// INSERT INTO books (
//   idLibro,
//   titulo,
//   isbn,
//   ano_de_publicacion,
//   editorial,
//   autor,
//   sinopsis,
//   imagen,
//   calificacion,
//   intercambios,
//   disponible
// ) VALUES (
//   '1e5701a3-ecf3-4fa6-9bca-59c6e83f42ef',
//   'Cien Años de Soledad',
//   '978-3-16-148410-0',
//   '1967',
//   'Editorial Sudamericana',
//   'Gabriel García Márquez',
//   'La historia de la familia Buendía en el pueblo ficticio de Macondo.',
//   'https://example.com/imagen_cien_anos.jpg',
//   5,
//   10,
//   true
// );
