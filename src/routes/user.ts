import express, { Request, Response, NextFunction, Router } from 'express';
import axios from 'axios';
import userInfoType from '../types/userInfo';
import { User } from '../model/user';
import { Op } from 'sequelize';
import { authToken } from '../middleware/authToken';
import { Service } from '../model/service';
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
            token: {
              ...data,
            },
            user: {
              ...exUser.dataValues,
            },
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
        await Service.create({
          UserId: userInfo.sub,
          pray: false,
          penalty: false,
          tweet: false,
        });
        return res.status(200).json({
          msg: `${userInfo.nickname}님 성공적으로 회원등록 되었습니다!`,
          payload: {
            token: {
              ...data,
            },
            user: {
              ...newUser.dataValues,
            },
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

router.get(
  '/:id',
  authToken,
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
      const user = await User.findOne({
        where: { id },
        attributes: ['id', 'oauth', 'name', 'img'],
        include: [
          {
            model: User,
            as: 'Followings',
            attributes: ['id'],
          },
          {
            model: User,
            as: 'Followers',
            attributes: ['id'],
          },
        ],
      });
      if (user) {
        return res.json({ code: 200, payload: user });
      }
      return res.json({ code: 404, msg: '해당되는 유저가 없습니다.' });
    } catch (e) {
      console.error(e);
      return next(e);
    }
  }
);

router.post(
  'auth/code',
  authToken,
  async (req: Request, res: Response, next: NextFunction) => {
    const { code }: { code: string } = req.body;
    try {
      if (code === (process.env.AUTH_CODE as string)) {
        await User.update(
          { authenticate: true },
          { where: { id: req.userId } }
        );
        return res.json({ msg: '인증되었습니다.', code: 200 });
      } else {
        return res
          .status(401)
          .json({ msg: '올바르지 않은 코드입니다.', code: 401 });
      }
    } catch (e) {
      next(e);
    }
  }
);

router.put(
  'service',
  authToken,
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      tweet,
      pray,
      penalty,
    }: { tweet: boolean; pray: boolean; penalty: boolean } = req.body;
    try {
      await Service.update(
        { tweet, pray, penalty },
        { where: { UserId: req.userId } }
      );
      return res.json({ msg: '서비스 사용설정이 완료되었습니다!', code: 200 });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/follow',
  authToken,
  async (req: Request, res: Response, next: NextFunction) => {
    const { isFollow, id } = req.body;
    console.log(isFollow, id);
    try {
      const user = await User.findOne({ where: { id: req.userId } });
      if (user) {
        if (isFollow) {
          await user.addFollowing(parseInt(id, 10));
          return res.json({
            code: 200,
            message: '성공적으로 팔로우 처리 되었습니다.',
          });
        } else {
          await user.removeFollowing(parseInt(id, 10));
          return res.json({
            code: 200,
            msg: '성공적으로 팔로우 취소 되었습니다.',
          });
        }
      } else {
        return res.status(403).json({ code: 403, msg: '잘못된 접근입니다.' });
      }
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);
export default router;
