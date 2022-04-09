/* eslint-disable prettier/prettier */
import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { DBModule } from '../db/database.module';
import { LoginMiddleware } from '../middleWare/login.middleware';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [DBModule, UserModule],
  controllers: [RoleController],
  providers: [RoleService],
})
export class RoleModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoginMiddleware)
      .forRoutes('role/member/update', 'role/auth/update', 'role/admin/update');
  }
}
// export class SysAppModule {}
