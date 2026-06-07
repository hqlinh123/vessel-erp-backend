import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import 'dotenv/config';
import { env } from 'prisma/config';
const adapter = new PrismaPg({
  connectionString: env('DATABASE_URL'),
});
console.log('process.env', process.env);
export const prisma = new PrismaClient({ adapter });
