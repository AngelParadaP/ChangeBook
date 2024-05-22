import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CredencialesService } from './credenciales.service';
import { CredencialesController } from './credenciales.controller';
import { Credenciales } from './entities';
import { Notification } from 'src/notificaciones/entities/notificaciones.entity';
import { User } from 'src/users/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Credenciales, Notification, User])],
  exports: [TypeOrmModule, CredencialesService],
  providers: [CredencialesService],
  controllers: [CredencialesController],
})
export class CredencialesModule {}