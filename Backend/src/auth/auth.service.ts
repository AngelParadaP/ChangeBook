import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CredencialesService } from 'src/credenciales/credenciales.service';
import { LoginDTO } from './dto/auth.dto';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private credencialesService: CredencialesService,
    private jwtService: JwtService,
  ) {}

  async signIn(creds: LoginDTO): Promise<{ access_token: string }> {
    const user = await this.credencialesService.findOne(creds.codigo);
    const isMatch = await bcrypt.compare(creds.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException();
    }
    const payload = { sub: user.codigo, username: user.correo };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async verifyToken(access_token: string) {
    try {
      const decoded = await this.jwtService.verifyAsync(access_token);
      return decoded;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
