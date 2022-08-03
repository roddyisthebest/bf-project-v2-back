import express, { Request, Response, NextFunction, Router } from 'express';
import axios from 'axios';
import userInfoType from '../types/userInfo';
import { User } from '../model/user';
import { Op } from 'sequelize';
const router = express.Router();

router.get(
  '/auth/kakao/callback',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data } = await axios.post(
        `https://kauth.kakao.com/oauth/token?grant_type=authorization_code&client_id=${process.env.REST_API_KEY}&&redirect_uri=${process.env.REDIRECT_URI}&code=${req.query.code}`
      );
      const { data: userInfo }: { data: userInfoType } = await axios.get(
        'https://kapi.kakao.com/v1/oidc/userinfo',
        {
          headers: {
            Authorization: `Bearer $${data.access_token}`,
          },
        }
      );

      const exUser = await User.findOne({
        where: {
          [Op.or]: [{ id: userInfo.sub }, { name: userInfo.nickname }],
        },
      });

      if (exUser) {
        return res.status(200).json({
          msg: `${userInfo.nickname}님 안녕하세요!`,
          payload: {
            ...data,
            ...exUser,
          },
        });
      } else {
        const newUser = await User.create({
          id: userInfo.sub,
          name: userInfo.nickname,
          oauth: 'kakao',
          img: userInfo.picture,
          authenticate: false,
          admin: false,
          payed: true,
        });
        return res.status(200).json({
          msg: `${userInfo.nickname}님 성공적으로 회원등록 되었습니다!`,
          payload: {
            ...data,
            ...newUser,
          },
        });
      }
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/logout',
  async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.headers.accesstoken, req.body.userId);
    try {
      await axios.post(
        `https://kapi.kakao.com/v1/user/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${req.headers.accesstoken}`,
          },
        }
      );
      res
        .status(200)
        .json({ msg: '성공적으로 로그아웃 되었습니다.', code: 200 });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

export default router;
