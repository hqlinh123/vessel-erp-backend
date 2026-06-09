import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { TenantMiddleware } from './modules/tenant/tenant.middleware';
import { PrismaModule } from './prisma/prisma.module';
import { CompanyModule } from './modules/system/companies/company.module';

@Module({
  imports: [CompanyModule, PrismaModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
