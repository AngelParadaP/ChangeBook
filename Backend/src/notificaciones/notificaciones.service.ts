import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notificaciones.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities';

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(Notification)
    private notificacionesRepository: Repository<Notification>,
    private userService: UsersService,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    const { codigoUsuario, mensaje } = createNotificationDto;
    const usuario = await this.userService.findOne(codigoUsuario);

    if (!usuario) {
      throw new NotFoundException('User not found in database');
    }

    const notification = new Notification();
    notification.mensaje = mensaje;
    notification.user = usuario;

    return await this.notificacionesRepository.save(notification);
  }

  async erase(idNotificacion: string) {
    const notificacion: Notification =
      await this.notificacionesRepository.findOne({
        where: {
          idNotificacion,
        },
      });

    if (!notificacion) {
      throw new NotFoundException('Notification not found in database');
    }

    return await this.notificacionesRepository.remove(notificacion);
  }
}
