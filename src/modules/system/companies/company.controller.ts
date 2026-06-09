// src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '../../../common/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { TokenGuard } from '../../auth/guards/token.guard';
import { CompanyService } from './company.service';
import { RegisterCompanyDto } from './dto/types';

@Controller('supper-admin')
export class CompanyController {
  constructor(private readonly authService: CompanyService) {}
  @UseGuards(TokenGuard, RolesGuard)
  @Roles(Role.SYSTEM_SUPER_ADMIN)
  @Post('register-company')
  @HttpCode(HttpStatus.CREATED)
  async registerCompany(@Body() registerCompanyDto: RegisterCompanyDto) {
    return this.authService.registerCompany(registerCompanyDto);
  }

  @UseGuards(TokenGuard, RolesGuard)
  @Roles(Role.SYSTEM_SUPER_ADMIN)
  @Get('companies')
  async getCompanies() {
    return this.authService.getCompanies({});
  }
}
