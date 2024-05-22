import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: LoginDTO) {
    return this.authService.signIn(signInDto);
  }

  @Post('verifyToken')
  async verifyToken(@Body() { access_token }: { access_token: string }) {
    try {
      const decoded = await this.authService.verifyToken(access_token);
      return { isValid: true, decoded };
    } catch (error) {
      return { isValid: false };
    }
  }
}
