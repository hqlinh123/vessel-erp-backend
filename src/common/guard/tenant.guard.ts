// src/common/guards/tenant.guard.ts

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const tenant = this.extractTenant(req);

    if (!tenant) {
      throw new UnauthorizedException('Missing tenant');
    }

    const normalizedTenant = tenant.toLowerCase();

    // SYSTEM domain bypass
    if (normalizedTenant === 'admin') {
      req['tenant'] = 'admin';
      req['company'] = null;
      return true;
    }

    // find company by subdomain
    const company = await this.prisma.company.findUnique({
      where: { subdomain: normalizedTenant },
    });

    if (!company) {
      throw new ForbiddenException('Invalid tenant');
    }

    if (!company.isActive) {
      throw new ForbiddenException('Company is inactive');
    }

    // attach context
    req['tenant'] = normalizedTenant;
    req['company'] = company;
    req['companyId'] = company.id;

    return true;
  }

  private extractTenant(req: Request): string | null {
    const headerTenant = req.headers['x-tenant-id'] as string;

    if (headerTenant) return headerTenant;

    const host = req.hostname; // santa123.pmsship.com

    const parts = host.split('.');

    if (parts.length < 2) return null;

    return parts[0]; // subdomain
  }
}
