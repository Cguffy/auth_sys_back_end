/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { DBService } from '../db/database.service';
// const CryptoJS = require('crypto-js');
// const stringRandom = require('string-random');

@Injectable()
export class UserService {
  constructor(private readonly dbService: DBService) {}
  private readonly logger = new Logger(DBService.name);
  // private secretKey = 'secretkey0123456';

  // decrypt(sSrc: string): string {
  //   const bytes = CryptoJS.AES.decrypt(sSrc, this.secretKey);
  //   const res = bytes.toString(CryptoJS.enc.Utf8);
  //   return res;
  // }

  async isRegisted(username: string): Promise<boolean> {
    const sql = 'select * from user where username = ?';
    const res = await this.dbService.query(sql, [username]);
    if (res.length == 0) {
      return false;
    }
    return true;
  }

  async register(new_user: any): Promise<any> {
    const phone_reg = /^[1][3,4,5,7,8,9][0-9]{9}$/;
    const email_reg =
      /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    const phone = new_user.phone || '';
    const email = new_user.email || '';
    if (
      (!phone_reg.test(phone) && phone != '') ||
      (!email_reg.test(email) && email != '')
    ) {
      throw new HttpException('服务器拒绝更新', 403);
    }
    const sql = `insert into user(username, password, nickname, realname, phone, email) values(?,?,?,?,?,?);`;
    const username = new_user.username;
    const password = new_user.password;
    const nickname = new_user.nickname || '';
    const realname = new_user.realname || '';
    await this.dbService.query(sql, [
      username,
      password,
      nickname,
      realname,
      phone,
      email,
    ]);
    this.logger.log(`user: ${new_user.username} regist successfully`);
    return { result: 'regist successfully' };
  }

  async login(username: string, password: string): Promise<{ token: string }> {
    const sql = `select * from user where username = ?`;
    const res = await this.dbService.query(sql, [username]);
    if (res.length != 0) {
      // const decPwd = this.decrypt(password);
      const decPwd = password;
      console.log('login decrypt pwd: ', decPwd);
      if (res[0].password == decPwd) {
        // const token = stringRandom(512, { specials: false });
        const token = '123123123123123123213123123';
        // const sql2 = `insert into token values(?,?) on duplicate key update token = ?`;
        // await this.dbService.query(sql2, [username, token, token]);
        this.logger.log(`user: ${username} login successfully`);
        return { token };
      } else {
        console.log('密码错误');
        throw new HttpException(
          {
            msg: '密码错误',
            code: 403,
          },
          403,
        );
      }
    } else if (res.length === 0) {
      throw new HttpException(
        {
          msg: '用户不存在',
          code: 403,
        },
        403,
      );
    } else {
      throw new HttpException(
        {
          msg: '数据库查询出错',
          code: 500,
        },
        500,
      );
    }
  }

  async logout(username: string): Promise<{ result: boolean }> {
    const sql = `delete from token where username = ?`;
    await this.dbService.query(sql, [username]);
    this.logger.log(`user: ${username} logout successfully`);
    return { result: true };
  }

  async update(username: string, new_info: any): Promise<any> {
    const phone_reg = /^[1][3,4,5,7,8,9][0-9]{9}$/;
    const email_reg =
      /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    const phone = new_info.phone || '';
    const email = new_info.email || '';
    const infoUsername = new_info.username || '';
    if (
      infoUsername != username ||
      (!phone_reg.test(phone) && phone != '') ||
      (!email_reg.test(email) && email != '')
    ) {
      throw new HttpException('服务器拒绝更新', 403);
    }
    // new_info.password = this.decrypt(new_info.password);
    // console.log('update decrypt pwd: ', new_info.password);
    let sql = `update user set `;
    let i: any;
    for (i in new_info) {
      if (new_info[i] != null) {
        sql += `${i} = '${new_info[i]}',`;
      }
    }
    sql = sql.substring(0, sql.length - 1);
    sql += ` where username = ?;`;
    // console.log(sql);
    const res = await this.dbService.query(sql, [username]).catch((err) => {
      throw new HttpException('服务器拒绝更新', 403);
    });
    this.logger.log(`user: ${username} update self-info successfully`);
    return res;
  }

  async getUsernameByToken(token: string): Promise<any> {
    const sql = `select * from token where token = ?`;
    const res = await this.dbService.query(sql, [token]);
    return res;
  }

  async getSelfRoleList(username: string): Promise<any> {
    const sql = `select * from role where is_delete = 0`;
    const roleList = await this.dbService.query(sql, [username]);
    const roleAdminSql = `select * from role_admin where username = ? and is_delete=0`;
    const roleAdminList = await this.dbService.query(roleAdminSql, [username]);
    const roleMemberSql = `select * from role_members where username = ? and is_delete=0`;
    const roleMemberList = await this.dbService.query(roleMemberSql, [
      username,
    ]);
    const selfRoleList = [];
    for (let i = 0; i < roleList.length; i++) {
      if (
        roleMemberList.findIndex((item) => {
          return item.role_id === roleList[i].role_id;
        }) >= 0
      )
        selfRoleList.push(roleList[i]);
    }
    for (let i = 0; i < selfRoleList.length; i++) {
      selfRoleList[i].is_admin =
        roleAdminList.findIndex(
          (item) => roleList[i].role_id === item.role_id,
        ) === -1
          ? 0
          : 1;
      const appInfo = await this.dbService.query(
        `select * from app where app_id = ?`,
        [selfRoleList[i].app_id],
      );
      selfRoleList[i].app_name = appInfo[0].app_name;
    }
    this.logger.log(`successfully get self role list`);
    return selfRoleList;
  }

  async getUserInfo(username: string): Promise<any> {
    const sql = `select * from user where username = ?`;
    const res = (await this.dbService.query(sql, [username]))[0];
    this.logger.log(`user: ${username} get self-info successfully`);
    return res;
  }

  async blogsCount(username: string): Promise<{ count: number }> {
    // console.log(username);
    const sql = `select count(1) as num from blogs where author = ?`;
    const res = await this.dbService.query(sql, [username]);
    // console.log(res[0].num);
    this.logger.log(
      `user: ${username} get the number of own blogs successfully`,
    );
    return { count: res[0].num };
  }
}
