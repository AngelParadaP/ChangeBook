import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CredencialesService } from './credenciales.service';
import { CreateCredentialDto } from './dto/credenciales.dto';
import * as bcrypt from 'bcrypt';
import { Credenciales } from './entities';

@Controller('credenciales')
export class CredencialesController {
  constructor(private credencialesService: CredencialesService) {}

  @Post('crear')
  create(@Body() body: CreateCredentialDto): Promise<CreateCredentialDto> {
    return this.credencialesService.create(body);
  }

  @Post('login')
  async login(@Body() body: { codigo: string; password: string }) {
    const { codigo, password } = body;
    const credencial = await this.credencialesService.findOne(codigo);

    if (!credencial) {
      return { success: false, message: 'Código incorrecto' };
    }
    if (!credencial.habilitado) {
      return { sucess: false, message: 'No has sido habilitad@' };
    }

    const match = await bcrypt.compare(password, credencial.password);

    if (match) {
      return { success: true, message: '¡Inicio de sesión exitoso!' };
    } else {
      return { success: false, message: 'Contraseña incorrecta' };
    }
  }

  @Get('/obtener/:codigo')
  getOne(@Param('codigo') codigo: string): Promise<CreateCredentialDto> {
    return this.credencialesService.findOne(codigo);
  }

  @Patch('habilitarUser/:codigo')
  habilitateUser(
    @Param('codigo') codigo: string,
    @Body() body: { habilitar: boolean }, // Espera un objeto con la propiedad 'habilitar'
  ): Promise<CreateCredentialDto> {
    return this.credencialesService.habilitateUser(codigo, body.habilitar); // Pasar directamente el valor booleano
  }

  @Get('noActivas')
  getNotActiveUsers(): Promise<Credenciales[]> {
    return this.credencialesService.getNotActiveUsers();
  }
}