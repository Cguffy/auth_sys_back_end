/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { DBService } from '../db/database.service';
import { UserService } from '../user/user.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RoleService {
  constructor(
    private readonly dbService: DBService,
    private readonly userService: UserService,
  ) {}
  private readonly logger = new Logger(DBService.name);

  async getRoleMemberList(body: Record<string, any>): Promise<any> {
    const sql = `select * from role_members where role_id = ? and is_delete = 0`;
    const memberList = await this.dbService.query(sql, [body.role_id]);
    this.logger.log(`successfully get all apps list`);
    return memberList;
  }

  // body.delete_mode: 1:删除; 0:增加
  async updateRoleMember(
    body: Record<string, any>,
    username: string,
  ): Promise<any> {
    // 检查用户是否有角色管理员权限
    const sql = `select * from role_admin where role_id = ? and is_delete = 0`;
    const roleAdminList = await this.dbService.query(sql, [body.role_id]);
    if (roleAdminList.findIndex((admin) => admin.username === username) < 0) {
      throw new HttpException('用户非管理员不可创建或更新', 403);
    }
    // 添加角色权限
    const getRoleMemberListSql = `select * from role_members where role_id = ?`;
    const roleMemberList = await this.dbService.query(getRoleMemberListSql, [
      body.role_id,
    ]);
    const updateSql = `update role_members set end_time = ?, is_delete = ? where role_id = ? and username = ?`;
    const createSql = `insert into role_members(role_id, username, end_time, is_delete) values(?,?,?,?,?)`;
    for (let i = 0; i < body.username_list.length; i++) {
      const [sql, params] =
        roleMemberList.findIndex(
          (admin) => admin.username === body.username_list[i],
        ) >= 0
          ? [
              updateSql,
              [
                body.end_time || '2000-01-01 00:00:00',
                body.delete_mode,
                body.role_id,
                body.username_list[i],
              ],
            ]
          : [
              createSql,
              [
                body.role_id,
                body.username_list[i],
                body.end_time || '2000-01-01 00:00:00',
                body.delete_mode,
              ],
            ];
      await this.dbService.query(sql, params);
    }
    this.logger.log(`successfully update role member`);
  }

  async getRoleAuthList(body: Record<string, any>): Promise<any> {
    const getAppResourceListSql = `select * from resource where app_id = ? and is_delete = 0`;
    const appResourceList = await this.dbService.query(getAppResourceListSql, [
      body.app_id,
    ]);
    const getRoleAuthListSql = `select * from role_auth where role_id = ? and is_delete = 0`;
    const roleAuthList = await this.dbService.query(getRoleAuthListSql, [
      body.role_id,
    ]);
    for (let i = 0; i < appResourceList.length; i++) {
      appResourceList[i].has_auth =
        roleAuthList.findIndex(
          (authItem) => authItem.resource_id === appResourceList[i].resource_id,
        ) >= 0
          ? 1
          : 0;
    }
    console.log('appResourceList: ', appResourceList);
    this.logger.log(`successfully get auth list`);
    return appResourceList;
  }

  // body.delete_mode: 1:删除; 0:增加
  async updateRoleAuth(
    body: Record<string, any>,
    username: string,
  ): Promise<any> {
    // 检查用户是否有角色管理员权限
    const sql = `select * from role_admin where role_id = ? and is_delete = 0`;
    const roleAdminList = await this.dbService.query(sql, [body.role_id]);
    if (roleAdminList.findIndex((admin) => admin.username === username) < 0) {
      throw new HttpException('用户非管理员不可创建或更新', 403);
    }
    // 获取所有角色权限，无论是否已软删除
    const getRoleAuthListSql = `select * from role_auth where role_id = ?`;
    const roleAuthList = await this.dbService.query(getRoleAuthListSql, [
      body.role_id,
    ]);
    // 有则更新，无则创建
    const updateSql = `update role_auth set is_delete = ? where resource_id = ?`;
    const createSql = `insert into role_auth(role_id, resource_id, resource_key, resource_name, resource_desc, is_delete) values(?,?,?,?,?,?)`;
    const getResourceInfoSql = `select * from resource where app_id = ? and resource_id = ? and is_delete = 0`;
    for (let i = 0; i < body.resource_list.length; i++) {
      // 判断表里是否已有数据
      const isDataCreated =
        roleAuthList.findIndex(
          (auth) =>
            auth.resource_id === body.resource_list[i] &&
            auth.role_id === body.role_id,
        ) >= 0;
      // 表里无数据时需查询资源信息用于创建权限时填充
      const resourceInfo = isDataCreated
        ? {}
        : (
            await this.dbService.query(getResourceInfoSql, [
              body.app_id,
              body.resource_list[i],
            ])
          )[0];
      // 根据先前是否已有数据判断设置 sql 语句以及相应 params
      const [sql, params] = isDataCreated
        ? [updateSql, [body.delete_mode, body.resource_list[i]]]
        : [
            createSql,
            [
              body.role_id,
              body.resource_list[i],
              resourceInfo.resource_key || '',
              resourceInfo.resource_name || '',
              resourceInfo.resource_desc || '',
              body.delete_mode,
            ],
          ];
      await this.dbService.query(sql, params);
    }
    this.logger.log(`successfully update role auth`);
  }

  async getRoleAdminList(body: Record<string, any>): Promise<any> {
    const sql = `select * from role_admin where role_id = ? and is_delete = 0`;
    const adminList = await this.dbService.query(sql, [body.role_id]);
    this.logger.log(`successfully get admin list`);
    return adminList;
  }

  // body.delete_mode: 1:删除; 0:增加
  async updateRoleAdmin(
    body: Record<string, any>,
    username: string,
  ): Promise<any> {
    // 检查用户是否有角色管理员权限
    const sql = `select * from role_admin where role_id = ?`;
    const roleAdminList = await this.dbService.query(sql, [body.role_id]);
    if (
      roleAdminList.findIndex(
        (admin) => admin.username === username && admin.is_delete === 0,
      ) < 0
    ) {
      throw new HttpException('用户非管理员不可创建或更新', 403);
    }
    // 添加角色权限
    const updateSql = `update role_admin set end_time = ?, is_delete = ? where role_id = ? and username = ?`;
    const createSql = `insert into role_admin(role_id, username, nickname, end_time, is_delete) values(?,?,?,?,?)`;
    const getUserInfoSql = `select * from user where username = ?`;
    for (let i = 0; i < body.username_list.length; i++) {
      const isDataCreated =
        roleAdminList.findIndex(
          (admin) => admin.username === body.username_list[i],
        ) >= 0;
      // 表里无数据时需查询资源信息用于创建权限时填充
      const userInfo = isDataCreated
        ? {}
        : (
            await this.dbService.query(getUserInfoSql, [body.username_list[i]])
          )[0];
      console.log('userInfo: ', userInfo);
      // 根据先前是否已有数据判断设置 sql 语句以及相应 params
      const [sql, params] = isDataCreated
        ? [
            updateSql,
            [
              body.end_time || '2000-01-01 00:00:00',
              body.delete_mode,
              body.role_id,
              body.username_list[i],
            ],
          ]
        : [
            createSql,
            [
              body.role_id,
              body.username_list[i],
              userInfo.nickname,
              body.end_time || '2000-01-01 00:00:00',
              body.delete_mode,
            ],
          ];
      await this.dbService.query(sql, params);
    }
    this.logger.log(`successfully update role admin`);
  }
}
