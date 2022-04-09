/* eslint-disable prettier/prettier */
import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { DBModule } from '../db/database.module';
import { LoginMiddleware } from '../middleWare/login.middleware';

@Module({
  imports: [DBModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoginMiddleware)
      .forRoutes(
        'user/update',
        'user/logout',
        'user/isLogin',
        'user/blogsCount',
        'user/info',
        'user/rolelist',
      );
  }
}
