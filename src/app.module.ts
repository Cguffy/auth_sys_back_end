import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DBModule } from './db/database.module';
import { UserModule } from './user/user.module';
import { SysAppModule } from './app/app.module';
import { RoleModule } from './role/role.module';

@Module({
  imports: [DBModule, UserModule, SysAppModule, RoleModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
