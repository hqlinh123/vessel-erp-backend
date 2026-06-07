// src/common/middleware/tenant.middleware.ts

import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface TenantRequest extends Request {
  tenant?: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: TenantRequest, res: Response, next: NextFunction) {
    const host = req.headers.host;

    if (!host) {
      throw new BadRequestException('Host header missing');
    }

    const hostname = host.split(':')[0];

    const parts = hostname.split('.');

    let tenant: string | null = null;

    if (parts.length >= 3) {
      tenant = parts[0];
    }

    req.tenant = tenant ?? undefined;

    next();
  }
}
