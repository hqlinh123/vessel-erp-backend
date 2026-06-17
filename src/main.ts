import { createServer } from 'http';
import serverless from 'serverless-http';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';

let cachedHandler: (arg0: any, arg1: any) => any;

export default async function handler(req: any, res: any) {
  if (!cachedHandler) {
    const app = await NestFactory.create(AppModule);
    await app.init();

    const expressApp = app.getHttpAdapter().getInstance();
    cachedHandler = serverless(expressApp);
  }

  return cachedHandler(req, res);
}