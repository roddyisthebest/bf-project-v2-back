import axios from 'axios';
import express, { Response, NextFunction } from 'express';
import { authToken } from '../middleware/authToken';
import { authUser } from '../middleware/authUser';
import jwt from 'jsonwebtoken';
import { generateAccessToken } from '../app';
const router = express.Router();

router.post(
  '/authenticate',
  authToken,
  authUser,
  async (req: any, res: Response, next: NextFunction) => {
    return res.send({ msg: 'accessToken이 유효합니다.', id: req.userId });
  }
);

router.post('/refresh', async (req: any, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res
      .status(401)
      .json({ code: 'invalid authentication', msg: '토큰이 없습니다.' });
  }
  if (req.headers.cookie === 'local login') {
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string,
      (error: any, user: any) => {
        if (error) {
          if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
              code: 'expired',
              message: 'refresh토큰이 만료되었습니다. 다시 로그인해주세요.',
            });
          } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
              code: 'invalid token',
              message: '유효하지 않은 토큰입니다.',
            });
          } else {
            return res.status(400).json({
              msg: '에러입니다!',
              code: 'bad request',
            });
          }
        }
        const accessToken = generateAccessToken(user.id);
        return res.send({
          msg: '토큰이 성공적으로 갱신되었습니다!',
          payload: { access_token: accessToken },
        });
      }
    );
  } else {
    try {
      const { data } = await axios.post(
        `https://kauth.kakao.com/oauth/token?grant_type=refresh_token&client_id=8e90fd53b25935044191bd3ebd2bf726&&refresh_token=${refreshToken}`
      );
      res.send({
        msg: '토큰이 성공적으로 갱신되었습니다!',
        payload: { ...data },
      });
    } catch (e: any) {
      if (e.response.status === 401 && e.response.data.code === 'A0002') {
        res.status(401).json({
          msg: 'refresh토큰이 만료되었습니다. 다시 로그인해주세요.',
          code: 'expired',
        });
      } else {
        console.log('400에러');
        res.status(400).json({
          msg: '에러입니다!',
          code: 'bad request',
        });
      }
    }
  }
});

export default router;
