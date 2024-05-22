import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class LoginDTO {
  @IsNotEmpty()
  @IsString()
  codigo: string;

  @IsNotEmpty()
  @IsStrongPassword()
  password: string;
}
