import {
  IsString,
  IsEmail,
  IsStrongPassword,
  IsNotEmpty,
  Contains,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateCredentialDto {
  @IsNotEmpty()
  @IsString()
  codigo: string;

  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

  @IsNotEmpty()
  @IsEmail()
  @Contains('@alumnos.udg.mx')
  correo: string;

  @IsOptional()
  @IsBoolean()
  habilitado: boolean;
}