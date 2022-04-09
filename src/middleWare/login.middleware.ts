/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/ban-types */
import { HttpException, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { DBService } from '../db/database.service';

@Injectable()
export class LoginMiddleware implements NestMiddleware {
  constructor(private readonly dbService: DBService) {}

  use(req, response: Response, next: Function) {
    // console.log('Request...');
    // const token = req.cookies.token;
    const username = req.body.username;
    const password = req.body.password;
    if (!username || !password) {
      const err = new HttpException('用户尚未登录', 403);
      next(err);
      return;
    }
    const sql = `select * from user where username = ? and password = ? and is_delete = 0`;
    this.dbService.query(sql, [username, password]).then((res) => {
      // console.log(res);
      if (res.length == 0) {
        const err = new HttpException('用户账号或密码错误', 403);
        next(err);
      } else {
        req.username = res[0].username;
        next();
      }
    });
  }
}
