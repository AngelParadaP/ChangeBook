import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { Credenciales } from './entities';
import { CreateCredentialDto } from './dto/credenciales.dto';
import { Notification } from 'src/notificaciones/entities/notificaciones.entity';
import { CreateNotificationDto } from 'src/notificaciones/dto/create-notification.dto';
import { User } from 'src/users/entities';

@Injectable()
export class CredencialesService {
  constructor(
    @InjectRepository(Credenciales)
    private credencialesRepository: Repository<Credenciales>,
    @InjectRepository(Notification)
    private notificacionesRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async create(credential: CreateCredentialDto): Promise<CreateCredentialDto> {
    // Verificar si el código de estudiante ya está registrado
    const existingCredential = await this.credencialesRepository.findOne({
      where: { codigo: credential.codigo },
    });

    if (existingCredential) {
      throw new BadRequestException(
        'El código de estudiante ya está registrado',
      );
    }
    credential.password = await this.maskPassword(credential.password);
    const newRecord = this.credencialesRepository.create(credential);
    this.credencialesRepository.save(newRecord);
    return credential;
  }

  async findOne(codigo: string): Promise<CreateCredentialDto> {
    return this.credencialesRepository.findOne({ where: { codigo } });
  }

  async maskPassword(password: string): Promise<string> {
    const saltOrRounds = 10;
    return await bcrypt.hash(password, saltOrRounds);
  }

  async habilitateUser(
    codigo: string,
    habilitar: boolean,
  ): Promise<CreateCredentialDto> {
    try {
      const user = await this.findOne(codigo);
      if (!user) {
        throw new NotFoundException('Credentials not found in database');
      }
      user.habilitado = habilitar;
      const payload = {
        codigoUsuario: user.codigo,
        mensaje: 'Fuiste verificado! - Disfruta de la aplicacion'
      }
      this.addComent(payload)
      return await this.credencialesRepository.save(user);
    } catch (err) {
      throw new InternalServerErrorException(
        'Server failed to update habilitation of user',
      );
    }
  }

  async getNotActiveUsers(): Promise<Credenciales[]> {
    try {
      const credenciales = await this.credencialesRepository.find({
        where: { habilitado: false },
      });

      if (credenciales.length === 0) {
        throw new NotFoundException(
          'No se encontraron credenciales inactivas en la base de datos',
        );
      }

      return credenciales;
    } catch (err) {
      throw new InternalServerErrorException(
        'El servidor no pudo obtener usuarios inactivos:',
        err,
      );
    }
  }

  async addComent(createNotificationDto: CreateNotificationDto) {
    const { codigoUsuario, mensaje } = createNotificationDto;
    const usuario = await this.userRepository.findOne({
      where: { codigo: codigoUsuario },
      relations: {
        notificaciones: true,
      },
    });

    console.log(usuario);
    if (!usuario) {
      throw new NotFoundException('User not found in database');
    }

    const notification = new Notification();
    notification.mensaje = mensaje;
    notification.user = usuario;

    return await this.notificacionesRepository.save(notification);
  }
}