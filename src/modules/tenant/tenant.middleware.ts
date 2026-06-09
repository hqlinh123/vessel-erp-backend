/* eslint-disable @typescript-eslint/no-namespace */
// src/common/middleware/tenant.middleware.ts

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host?.split(':')[0] || '';

    let tenant: string | undefined;

    // Local development
    if (host === 'localhost' || host === '127.0.0.1') {
      tenant = req.headers['x-tenant-id'] as string;
    }

    // Production
    else {
      const parts = host.split('.');

      // bme.pmsship.com
      if (parts.length >= 3) {
        tenant = parts[0];
      }
    }

    req.tenant = tenant;

    console.log('Tenant:', tenant);

    next();
  }
}
