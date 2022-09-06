import express, { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import userInfoType from '../types/userInfo';
import { User } from '../model/user';
import { Op } from 'sequelize';
import { authToken } from '../middleware/authToken';
import { Service } from '../model/service';
import { Penalty } from '../model/penalty';
import { Tweet } from '../model/tweet';
import { authId } from '../middleware/authId';
import { authUser } from '../middleware/authUser';
import { Pray } from '../model/pray';
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

      console.log('요청!');
      const exUser = await User.findOne({
        where: {
          [Op.or]: [{ id: userInfo.sub }, { name: userInfo.nickname }],
        },
      });

      if (exUser) {
        return res.status(200).json({
          msg: `${exUser.name}님 안녕하세요!`,
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
  authToken,
  authUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await axios.post(
        `https://kapi.kakao.com/v1/user/logout`,
        {},
        {
          headers: {
            Authorization: `${req.headers.authorization}`,
          },
        }
      );
      res
        .status(200)
        .json({ msg: '성공적으로 로그아웃 되었습니다.', code: 'success' });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.get(
  '/:id/info',
  authToken,
  authUser,
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
      const user = await User.findOne({
        where: { id },
        attributes: ['id', 'oauth', 'name', 'img', 'createdAt', 'updatedAt'],
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
        return res.json({ code: 'success', payload: user });
      }
      return res.json({ code: 'not found', msg: '해당되는 유저가 없습니다.' });
    } catch (e) {
      console.error(e);
      return next(e);
    }
  }
);

router.get(
  '/',
  authToken,
  authUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(req.userId);
      const user = await User.findOne({
        where: { id: req.userId },
        attributes: ['id', 'oauth', 'name', 'img', 'createdAt', 'updatedAt'],
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
          {
            model: Service,
          },
        ],
      });
      if (user) {
        return res.json({ code: 'success', payload: user });
      }
      return res
        .status(401)
        .json({ code: 'wrong access', msg: '권한이 없습니다.' });
    } catch (e) {
      console.error(e);
      return next(e);
    }
  }
);

router.post(
  '/auth/code',
  authToken,
  async (req: Request, res: Response, next: NextFunction) => {
    const { code }: { code: string } = req.body;
    console.log(code);
    try {
      if (code === (process.env.AUTH_CODE as string)) {
        await User.update(
          { authenticate: true },
          { where: { id: req.userId } }
        );
        return res.json({ msg: '인증되었습니다.', code: 'success' });
      } else {
        return res.status(401).json({
          msg: '올바르지 않은 코드입니다.',
          code: 'wrong information',
        });
      }
    } catch (e) {
      next(e);
    }
  }
);

router.put(
  '/',
  authToken,
  authUser,
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body;
    try {
      await User.update({ name }, { where: { id: req.userId } });
      res.json({
        msg: '성공적으로 회원님의 정보가 바뀌었습니다.',
        code: 'success',
      });
    } catch (e) {
      next(e);
    }
  }
);

router.put(
  '/service',
  authToken,
  authUser,
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
      return res.json({
        msg: '서비스 사용설정이 완료되었습니다!',
        code: 'success',
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/follow',
  authToken,
  authUser,
  async (req: Request, res: Response, next: NextFunction) => {
    const { isFollow, id } = req.body;
    console.log(isFollow, id);
    try {
      const user = await User.findOne({ where: { id: req.userId } });
      if (user) {
        if (isFollow) {
          await user.addFollowing(parseInt(id, 10));
          return res.json({
            code: 'success',
            message: '성공적으로 팔로우 처리 되었습니다.',
            payload: { id },
          });
        } else {
          await user.removeFollowing(parseInt(id, 10));
          return res.json({
            code: 'success',
            msg: '성공적으로 팔로우 취소 되었습니다.',
            payload: { id },
          });
        }
      } else {
        return res
          .status(401)
          .json({ code: 'Unauthorized', msg: '잘못된 접근입니다.' });
      }
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.post(
  '/check',
  authToken,
  async (req: Request, res: Response, next: NextFunction) => {
    const { id, payed }: { id: number; payed: boolean } = req.body;
    try {
      console.log(payed);
      await User.update({ payed }, { where: { id } });
      return res.send({
        code: 'success',
        msg: '유저의 벌금 제출 설정란이 성공적으로 변경되었습니다.',
      });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.post(
  '/phoneToken',
  authToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phoneToken }: { phoneToken: string } = req.body;
      await User.update({ phoneToken }, { where: { id: req.userId } });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.get(
  '/:id/penaltys/:lastId',
  authToken,
  authUser,
  authId,
  async (req: Request, res: Response, next: NextFunction) => {
    const { lastId: lstId, id } = req.params;

    try {
      const where = { id: {}, UserId: id };
      const lastId = parseInt(lstId, 10);
      if (lastId && lastId !== -1) {
        where.id = { [Op.lt]: lastId };
      }

      const penaltys = await Penalty.findAll({
        where: lastId === -1 ? { UserId: id } : where,
        limit: 10,
        order: [['id', 'DESC']],
      });

      if (penaltys.length === 5) {
        return res.json({
          code: 'success',
          payload: penaltys,
          msg: `회원번호 ${id} 유저의 트윗 목록입니다.`,
        });
      } else {
        return res.json({
          code: 'last data',
          payload: penaltys,
          msg: `회원번호 ${id} 유저의 마지막 페이지 트윗 목록입니다.`,
        });
      }
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
);

router.get(
  '/:id/tweets/:lastId',
  authToken,
  authUser,
  authId,
  async (req: Request, res: Response, next: NextFunction) => {
    const { lastId: lstId, id } = req.params;
    const lastId = parseInt(lstId, 10);

    console.log(lastId, id);
    try {
      const where = { id: {}, UserId: id };
      if (lastId && lastId !== -1) {
        where.id = { [Op.lt]: lastId };
      }

      const tweets = await Tweet.findAll({
        where: lastId === -1 ? { UserId: id } : where,
        limit: 5,
        include: [
          {
            model: User,
            attributes: ['id', 'img', 'name', 'oauth', 'createdAt'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      if (tweets.length === 5) {
        return res.json({
          code: 'success',
          payload: tweets,
          msg: `회원번호 ${id} 유저의 트윗 목록입니다.`,
        });
      } else {
        return res.json({
          code: 'last data',
          payload: tweets,
          msg: `회원번호 ${id} 유저의 마지막 페이지 트윗 목록입니다.`,
        });
      }
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
);

router.get(
  '/:id/prays/:lastId',
  authToken,
  authUser,
  authId,
  async (req: Request, res: Response, next: NextFunction) => {
    const { lastId: lstId, id } = req.params;
    const lastId = parseInt(lstId, 10);
    try {
      const where = { id: {}, UserId: id };
      if (lastId && lastId !== -1) {
        where.id = { [Op.lt]: lastId };
      }

      const prays = await Pray.findAll({
        where: lastId === -1 ? { UserId: id } : where,
        limit: 15,
        order: [['createdAt', 'DESC']],
      });

      if (prays.length === 5) {
        return res.json({
          code: 'success',
          payload: prays,
          msg: `회원번호 ${id} 유저의 기도제목 목록입니다.`,
        });
      } else {
        return res.json({
          code: 'last data',
          payload: prays,
          msg: `회원번호 ${id} 유저의 마지막 페이지 기도제목 목록입니다.`,
        });
      }
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
);
export default router;
