/* eslint-disable prettier/prettier */
import { Controller } from '@nestjs/common';
import { DBService } from './database.service';

@Controller()
export class DBController {
  constructor(private readonly dbService: DBService) {}

//   @Get()
//   getHello(): string {
//     return this.appService.getHello();
//   }
}
