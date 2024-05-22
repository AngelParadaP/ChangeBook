import { IsNotEmpty, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  codigoUsuario: string;

  @IsString()
  @IsNotEmpty()
  mensaje: string;
}
