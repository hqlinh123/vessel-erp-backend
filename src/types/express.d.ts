// src/types/express.d.ts

import { Company } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      tenant?: string;
      company?: Company;
    }
  }
}

export {};
