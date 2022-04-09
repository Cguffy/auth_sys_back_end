/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  HttpException,
  Query,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller('app')
export class AppController {
  constructor(private readonly AppService: AppService) {}

  @Post('list/all')
  async getAllAppsList(@Req() req): Promise<any> {
    console.log('get all apps list request');
    const appsList = await this.AppService.getAllAppsList(req.username);
    return { appsList };
  }

  @Post('list/self')
  async getSelfBlogs(@Req() req): Promise<any> {
    const appsList = await this.AppService.getSelfAppsList(req.username);
    return { appsList };
  }

  @Post('admin/list')
  async getAppAdminList(@Req() req): Promise<any> {
    const adminList = await this.AppService.getAppAdminList(req.body.app_id);
    return { adminList };
  }

  @Post('admin/update')
  async updateAppAdmin(@Req() req): Promise<any> {
    await this.AppService.updateAppAdmin(req.body, req.username);
    return { code: 0, msg: 'success' };
  }

  @Post('role/list')
  async getRoleList(@Req() req): Promise<any> {
    const roleList = await this.AppService.getRoleList(req.body.app_id);
    return { roleList };
  }

  @Post('role/create')
  async createRole(@Req() req): Promise<any> {
    await this.AppService.createRole(req.body, req.username);
    return { code: 0, msg: 'success' };
  }

  @Post('resource/list')
  async getResourceList(@Req() req): Promise<any> {
    const resourceList = await this.AppService.getResourceList(req.body.app_id);
    return { resourceList };
  }

  @Post('resource/create')
  async createResource(@Req() req): Promise<any> {
    await this.AppService.createResource(req.body, req.username);
    return { code: 0, msg: 'success' };
  }
}
