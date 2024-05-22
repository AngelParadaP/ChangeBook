import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Post('agregarPara')
  create(@Body() createNotificationDto: CreateNotificationDto): Promise<any> {
    return this.notificacionesService.create(createNotificationDto);
  }

  @Delete('borrar/:idNotificacion')
  erase(@Param('idNotificacion') idNotificacion: string) {
    return this.notificacionesService.erase(idNotificacion);
  }
}
