// src/auth/auth.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('login')
  async login(@Body() dto: LoginDto, @Tenant() tenant?: string) {
    return this.authService.login(dto, tenant);
  }
}
