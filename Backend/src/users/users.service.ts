import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities';
import { UploadService } from 'src/upload/upload.service';
import { UserImageInsertDto } from './dto/image-insert.dto';
import { CredencialesService } from 'src/credenciales/credenciales.service';
import { Book } from 'src/books/entities';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Book) private bookRepository: Repository<Book>,
    private readonly uploadService: UploadService,
    private readonly credencialesService: CredencialesService,
  ) {}

  async create(
    user: CreateUserDto,
    file: Express.Multer.File,
  ): Promise<CreateUserDto> {
    try {
      const { codigo } = user;
      const tituloCreator: UserImageInsertDto = {
        codigo,
        credencial: true,
      };

      const url = await this.uploadService.uploadUserImages(
        tituloCreator,
        file.buffer,
      );

      const newRecord = this.userRepository.create(user);
      newRecord.imagenCredencial = url;
      return await this.userRepository.save(newRecord);
    } catch (err) {
      return err;
    }
  }

  findAll() {
    return this.userRepository.find();
  }

  async findOne(codigo: string): Promise<User> {
    let user: User;
    try {
      user = await this.userRepository.findOne({
        where: { codigo },
        relations: {
          notificaciones: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Server failed to search for the user',
      );
    }
    if (!user) {
      throw new NotFoundException('User not found in database');
    }
    return user;
  }

  async getUserWithReports(codigo: string) {
    try {
      const user = await this.userRepository.findOne({
        where: {
          codigo,
        },
        relations: {
          reportes: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found in database');
      }
      return user;
    } catch (err) {
      throw new InternalServerErrorException(
        'Server failed to retrieve user with reports',
        err,
      );
    }
  }

  async update(codigo: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (!updateUserDto || Object.keys(updateUserDto).length === 0) {
      throw new BadRequestException('No values sent to modify');
    }

    let user: User;
    try {
      user = await this.userRepository.findOne({
        where: { codigo },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Server failed to search for the user',
      );
    }

    if (!user) {
      throw new NotFoundException('User not found in database');
    }
    Object.assign(user, updateUserDto);

    try {
      await this.userRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException(
        'Server failed to update the user',
      );
    }
    return user;
  }

  async updateImage(codigo: string, file: Express.Multer.File): Promise<User> {
    try {
      const user: User = await this.userRepository.findOne({
        where: { codigo },
      });

      if (!user) {
        throw new NotFoundException('User not found in database');
      }

      const titleCreator: UserImageInsertDto = {
        codigo,
        credencial: false,
      };

      const urlImagen = await this.uploadService.uploadUserImages(
        titleCreator,
        file.buffer,
      );

      user.imagenPerfil = urlImagen;

      return await this.userRepository.save(user);
    } catch (err) {
      throw new InternalServerErrorException(
        'Server failed to update user profile image',
        err,
      );
    }
  }

  async remove(codigo: string): Promise<User> {
    let user: User;
    try {
      user = await this.userRepository.findOne({ where: { codigo } });
    } catch (error) {
      throw new InternalServerErrorException('Server failed to delete user');
    }
    if (!user) {
      throw new NotFoundException('User not found in database');
    }
    this.userRepository.remove(user);
    return user;
  }

  async getUserBooks(codigo: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { codigo },
        relations: {
          libros: true,
        },
      });
      if (!user) {
        throw new NotFoundException('User not found in database');
      }
      return user;
    } catch (err) {
      throw new InternalServerErrorException(
        'Server failed to get user with books',
      );
    }
  }

  async getNoActive(): Promise<User[]> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.credenciales', 'credenciales')
      .where('credenciales.habilitado = :habilitado', { habilitado: false })
      // .orderBy('user.creadoEn', 'ASC')
      .getMany();

    return users;
  }

  async addStrike(codigo: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { codigo },
      });
      if (!user) {
        throw new NotFoundException('User not found in database');
      }
      if (user.strikes < 3) {
        user.strikes++;
      }
      if (user.strikes === 3) {
        this.credencialesService.habilitateUser(codigo, false);
        return user;
      }
      return this.userRepository.save(user);
    } catch (err) {
      throw new InternalServerErrorException('Server failed to add a strike');
    }
  }
}
