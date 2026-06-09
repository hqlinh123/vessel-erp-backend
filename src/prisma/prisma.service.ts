// src/prisma/prisma.service.ts

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import 'dotenv/config';
import { env } from 'prisma/config';
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString: env('DATABASE_URL'),
      }),

      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    await this.$connect();

    console.log('✅ Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();

    console.log('❌ Database disconnected');
  }
}
