/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { DBService } from '../db/database.service';
import { UserService } from '../user/user.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AppService {
  constructor(
    private readonly dbService: DBService,
    private readonly userService: UserService,
  ) {}
  private readonly logger = new Logger(DBService.name);

  async getAllAppsList(username: string): Promise<any> {
    const sql = `select * from app where is_delete = 0`;
    const appsList = await this.dbService.query(sql, []);
    const userAdminSql = `select * from app_admin where username = ?`;
    const userAdminList = await this.dbService.query(userAdminSql, [username]);
    for (let i = 0; i < appsList.length; i++) {
      appsList[i].is_admin =
        userAdminList.findIndex(
          (item) => appsList[i].app_id === item.app_id,
        ) === -1
          ? 0
          : 1;
    }
    this.logger.log(`successfully get all apps list`);
    return appsList;
  }

  async getSelfAppsList(username: string): Promise<any> {
    const sql = `select * from app where creator = ? and is_delete = 0`;
    const appsList = await this.dbService.query(sql, [username]);
    const userAdminSql = `select * from app_admin where username = ?`;
    const userAdminList = await this.dbService.query(userAdminSql, [username]);
    for (let i = 0; i < appsList.length; i++) {
      appsList[i].is_admin =
        userAdminList.findIndex(
          (item) => appsList[i].app_id === item.app_id,
        ) === -1
          ? 0
          : 1;
    }
    this.logger.log(`successfully get self apps list`);
    return appsList;
  }

  async getAppAdminList(app_id: string): Promise<any> {
    const sql = `select * from app_admin where app_id = ? and is_delete = 0`;
    const appAdminList = await this.dbService.query(sql, [app_id]);
    this.logger.log(`successfully get admin list`);
    return appAdminList;
  }

  async updateAppAdmin(
    body: Record<string, any>,
    username: string,
  ): Promise<any> {
    const sql = `select * from app_admin where app_id = ? and is_delete = 0`;
    const appAdminList = await this.dbService.query(sql, [body.app_id]);
    if (appAdminList.findIndex((admin) => admin.username === username) < 0) {
      throw new HttpException('用户非管理员不可创建或更新', 403);
    }
    const updateSql = `update app_admin set end_time = ? where app_id = ? and username = ?`;
    const createSql = `insert into app_admin(app_id, username, end_time) values(?,?,?)`;
    for (let i = 0; i < body.username_list.length; i++) {
      console.log(`username${i}: ${body.username_list[i]}`);
      const [sql, params] =
        appAdminList.findIndex(
          (admin) => admin.username === body.username_list[i],
        ) >= 0
          ? [updateSql, [body.end_time, body.app_id, body.username_list[i]]]
          : [createSql, [body.app_id, body.username_list[i], body.end_time]];
      await this.dbService.query(sql, params);
    }
    this.logger.log(`successfully update app admin`);
  }

  async getRoleList(app_id: string): Promise<any> {
    const sql = `select * from role where app_id = ? and is_delete = 0`;
    const roleList = await this.dbService.query(sql, [app_id]);
    for (let i = 0; i < roleList.length; i++) {
      const memberList = await this.dbService.query(
        `select count(*) as count from role_members where role_id = ?`,
        [roleList[i].role_id],
      );
      roleList[i].member_count = memberList[0].count;
    }
    this.logger.log(`successfully get admin list`);
    return roleList;
  }

  async createRole(body: Record<string, any>, username: string): Promise<any> {
    const role_id = uuidv4();
    const adminListSql = `select * from app_admin where app_id = ? and is_delete = 0`;
    const appAdminList = await this.dbService.query(adminListSql, [
      body.app_id,
    ]);
    if (appAdminList.findIndex((admin) => admin.username === username) < 0) {
      throw new HttpException('用户非管理员不可创建或更新', 403);
    }
    // 创建角色
    const createRoleSql = `insert into role(app_id, role_id, role_name, role_desc) values(?,?,?,?)`;
    await this.dbService.query(createRoleSql, [
      body.app_id,
      role_id,
      body.role_name,
      body.role_desc,
    ]);
    // 添加角色成员
    const createRoleMemberSql = `insert into role_members(role_id,username,nickname,end_time) values(?,?,?,?)`;
    const members = body.member_list;
    for (let i = 0; i < members.length; i++) {
      const userInfo =
        (await this.userService.getUserInfo(members[i]))[0] || {};
      await this.dbService.query(createRoleMemberSql, [
        role_id,
        userInfo.username,
        userInfo.nickname,
        body.end_time,
      ]);
    }
    // 添加角色管理员
    const createRoleAdminSql = `insert into role_admin(role_id,username,nickname,end_time) values(?,?,?,?)`;
    const admins = body.admin_list;
    for (let i = 0; i < admins.length; i++) {
      const userInfo = (await this.userService.getUserInfo(admins[i]))[0] || {};
      await this.dbService.query(createRoleAdminSql, [
        role_id,
        userInfo.username,
        userInfo.nickname,
        body.end_time,
      ]);
    }
    this.logger.log(`successfully create role`);
  }

  async getResourceList(app_id: string): Promise<any> {
    const sql = `select * from resource where app_id = ? and is_delete = 0`;
    const appResourceList = await this.dbService.query(sql, [app_id]);
    this.logger.log(`successfully get resource list`);
    return appResourceList;
  }

  async createResource(
    body: Record<string, any>,
    username: string,
  ): Promise<any> {
    const resource_id = uuidv4();
    const sql = `select * from app_admin where app_id = ? and is_delete = 0`;
    const appAdminList = await this.dbService.query(sql, [body.app_id]);
    if (appAdminList.findIndex((admin) => admin.username === username) < 0) {
      throw new HttpException('用户非管理员不可创建或更新', 403);
    }
    // 创建资源
    const findResourceSql = `select * from resource where app_id = ? and resource_key = ? and is_delete = 0`;
    const resource = await this.dbService.query(findResourceSql, [
      body.app_id,
      body.resource_key,
    ]);
    // resource 不存在时创建，存在时更新
    const createResourceSql = `insert into resource(app_id, resource_id, resource_key, resource_name, resource_desc) values(?,?,?,?,?)`;
    const updateResourceSql =
      'update resource set resource_name = ?, resource_desc = ? where app_id = ? and resource_key = ?';
    const [resourceSql, params] =
      resource.length > 0
        ? [
            updateResourceSql,
            [
              body.resource_name,
              body.resource_desc,
              body.app_id,
              body.resource_key,
            ],
          ]
        : [
            createResourceSql,
            [
              body.app_id,
              resource_id,
              body.resource_key,
              body.resource_name,
              body.resource_desc,
            ],
          ];
    await this.dbService.query(resourceSql, params);
    // 没有才授权角色
    const getAuthListSql = `select * from role_auth where role_id = ? and resource_id = ?`;
    const authRoleSql = `insert into role_auth(role_id,resource_id, resource_key, resource_name, resource_desc) values(?,?,?,?,?)`;
    const roleList = body.role_list;
    for (let i = 0; i < roleList.length; i++) {
      const authList =
        resource.length > 0
          ? await this.dbService.query(getAuthListSql, [
              roleList[i],
              resource[0].resource_id,
            ])
          : [];
      authList.length === 0 &&
        (await this.dbService.query(authRoleSql, [
          roleList[i],
          resource_id,
          body.resource_key,
          body.resource_name,
          body.resource_desc,
        ]));
    }
    this.logger.log(`successfully create resource`);
  }
}
