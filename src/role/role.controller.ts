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
import { RoleService } from './role.service';

@Controller('role')
export class RoleController {
  constructor(private readonly RoleService: RoleService) {}

  @Post('member/list')
  async getRoleMemberList(@Req() req): Promise<any> {
    const memberList = await this.RoleService.getRoleMemberList(req.body);
    return { memberList };
  }

  @Post('member/update')
  async updateRoleMember(@Req() req): Promise<any> {
    await this.RoleService.updateRoleMember(req.body, req.username);
    return { code: 0, msg: 'success' };
  }

  @Post('auth/list')
  async getRoleAuthList(@Req() req): Promise<any> {
    const authList = await this.RoleService.getRoleAuthList(req.body);
    return { authList };
  }

  @Post('auth/update')
  async updateRoleAuth(@Req() req): Promise<any> {
    await this.RoleService.updateRoleAuth(req.body, req.username);
    return { code: 0, msg: 'success' };
  }

  @Post('admin/list')
  async getRoleAdminList(@Req() req): Promise<any> {
    const adminList = await this.RoleService.getRoleAdminList(req.body);
    return { adminList };
  }

  @Post('admin/update')
  async updateRoleAdmin(@Req() req): Promise<any> {
    await this.RoleService.updateRoleAdmin(req.body, req.username);
    return { code: 0, msg: 'success' };
  }
}
