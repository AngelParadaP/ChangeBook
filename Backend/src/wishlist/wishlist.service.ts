import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { Repository } from 'typeorm';
import { Book } from 'src/books/entities';
import { CreateNotificationDto } from 'src/notificaciones/dto/create-notification.dto';
import { NotificacionesService } from 'src/notificaciones/notificaciones.service';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistRepository: Repository<Wishlist>,
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  async create(createWishlistDto: CreateWishlistDto) {
    const { codigo, idLibro } = createWishlistDto;
    const elemento = await this.wishlistRepository.find({
      where: {
        codigoUsuario: codigo,
        idDelLibro: idLibro,
      },
    });

    if (elemento.length > 0) {
      throw new BadRequestException('El libro ya esta en la lista de deseados');
    }
    const ListElement = new Wishlist();
    ListElement.codigoUsuario = codigo;
    ListElement.idDelLibro = idLibro;
    return await this.wishlistRepository.save(ListElement);
  }

  async findUserWishList(codigo: string) {
    const elementos = await this.wishlistRepository.find({
      where: {
        codigoUsuario: codigo,
      },
    });
    if (!elementos || elementos.length === 0) {
      throw new NotFoundException('Lista de libros deseados no encontrada');
    }
    const librosPromises = elementos.map(async (elemento) => {
      const libro = await this.bookRepository.findOne({
        where: {
          idLibro: elemento.idDelLibro,
        },
        relations: {
          user: true,
        },
      });
      return libro;
    });

    // Esperamos que todas las consultas se completen
    const libros = await Promise.all(librosPromises);

    return libros;
  }

  async borrar(createWishlistDto: CreateWishlistDto) {
    const { codigo, idLibro } = createWishlistDto;
    const elemento = await this.wishlistRepository.findOne({
      where: {
        codigoUsuario: codigo,
        idDelLibro: idLibro,
      },
    });
    return await this.wishlistRepository.remove(elemento);
  }

  async sendWishListNoti(idLibro: string): Promise<string> {
    try {
      // Buscar elementos en la lista de deseos para el libro dado
      const elementos = await this.wishlistRepository.find({
        where: {
          idDelLibro: idLibro,
        },
      });

      if (elementos.length === 0) {
        return 'No hay elementos en la lista de deseos para este libro';
      }

      const libro = await this.bookRepository.findOne({
        where: {
          idLibro,
        },
      });

      const promises = elementos.map(async (elemento) => {
        // Crear una nueva notificación para cada elemento en la lista de deseos
        const noti: CreateNotificationDto = {
          codigoUsuario: elemento.codigoUsuario,
          mensaje: `El libro ${libro.titulo} está disponible`,
        };
        await this.notificacionesService.create(noti);
      });

      // Esperar a que todas las promesas se resuelvan
      await Promise.all(promises);

      // Mensaje de éxito cuando todas las promesas se hayan resuelto
      return 'Ok';
    } catch (error) {
      // Manejar cualquier error aquí
      console.error(
        'Error al enviar las notificaciones de la lista de deseos:',
        error,
      );
      throw error; // Lanzar el error para que se maneje externamente si es necesario
    }
  }
}
