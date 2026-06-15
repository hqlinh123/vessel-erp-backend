// src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { TokenGuard } from '../../auth/guards/token.guard';
import { CompanyService } from './company.service';
import { InviteUserDto, RegisterCompanyDto, UpdateCompanyDto } from './dto/types';
import { Role } from '../../../common/constants';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('super-admin')
@UseGuards(TokenGuard, RolesGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) { }
  @Post('companies/register')
  @HttpCode(HttpStatus.CREATED)
  async registerCompany(@Body() registerCompanyDto: RegisterCompanyDto) {
    return this.companyService.registerCompany(registerCompanyDto);
  }
  @Get('companies')
  async getCompanies(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.companyService.getCompanies({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search: search || undefined,
    });
  }

  @Get('companies/:id')
  async getCompanyById(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyService.getCompanyById(id);
  }
  @Put('companies/:id')
  async updateCompany(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companyService.updateCompany(id, dto);
  }

  @Delete('companies/:id')
  async deleteCompany(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('permanent') permanent?: string,
  ) {
    const softDelete = permanent !== 'true';
    return this.companyService.deleteCompany(id, softDelete);
  }
  @Post('companies:id/restore')
  async restoreCompany(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyService.restoreCompany(id);
  }

  @Patch('companies/:id/toggle-status')
  async toggleCompanyStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.companyService.toggleCompanyStatus(id, isActive);
  }

  @Post(':companyId/invite')
  @Roles(Role.COMPANY_ADMIN, Role.SYSTEM_SUPER_ADMIN)
  async inviteUser(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body('id') id: string,
    @Body() dto: InviteUserDto,
  ) {
    return this.companyService.inviteUser(companyId, id, dto);
  }

  @Post('accept-invite')
  async acceptInvite(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    return this.companyService.acceptInvite(token, password);
  }

  @Get(':companyId/users')
  @Roles(Role.COMPANY_ADMIN, Role.MANAGER, Role.USER)
  async getCompanyUsers(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.companyService.getCompanyUsers(companyId, id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      role,
    });
  }

  @Get(':companyId/invites')
  @Roles(Role.COMPANY_ADMIN, Role.SYSTEM_SUPER_ADMIN)
  async getPendingInvites(@Param('companyId', ParseUUIDPipe) companyId: string) {
    return this.companyService.getPendingInvites(companyId);
  }

  @Delete(':companyId/invites/:inviteId')
  @Roles(Role.COMPANY_ADMIN, Role.SYSTEM_SUPER_ADMIN)
  async cancelInvite(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('inviteId', ParseUUIDPipe) inviteId: string,
     @Body('id') id: string,
  ) {
    return this.companyService.cancelInvite(companyId, inviteId, id);
  }

  @Post(':companyId/invites/:inviteId/resend')
  @Roles(Role.COMPANY_ADMIN, Role.SYSTEM_SUPER_ADMIN)
  async resendInvite(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('inviteId', ParseUUIDPipe) inviteId: string,
    @Body('id') id: string,
  ) {
    return this.companyService.resendInvite(companyId, inviteId, id);
  }
}
