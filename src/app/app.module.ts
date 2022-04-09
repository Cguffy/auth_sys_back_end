/* eslint-disable prettier/prettier */
import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DBModule } from '../db/database.module';
import { LoginMiddleware } from '../middleWare/login.middleware';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [DBModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class SysAppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoginMiddleware)
      .forRoutes(
        'app/viewed',
        'app/update',
        'app/list/self',
        'app/list/all',
        'app/admin/update',
        'app/role/create',
        'app/resource/create',
      );
  }
}
