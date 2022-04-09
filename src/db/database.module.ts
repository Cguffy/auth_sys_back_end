/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { DBController } from './database.controller';
// import { AppService } from './app.service';
import { DBService } from './database.service';

@Module({
  imports: [],
  controllers: [DBController],
  providers: [DBService],
  exports: [DBService],
})
export class DBModule {}
