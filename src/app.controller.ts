import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

// @Controller('company')
// export class CompanyController {
//   @Get('current')
//   getCurrentCompany(@Req() req: TenantRequest) {
//     return {
//       tenant: req.tenant,
//     };
//   }
// }
