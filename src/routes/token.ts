import axios from 'axios';
import express, { Request, Response, NextFunction } from 'express';
import { authToken } from '../middleware/authToken';
import { authUser } from '../middleware/authUser';
const router = express.Router();

router.post(
  '/authenticate',
  authToken,
  authUser,
  async (req: Request, res: Response, next: NextFunction) => {
    return res.send({ msg: 'accessToken이 유효합니다.', id: req.userId });
  }
);

router.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      const { data } = await axios.post(
        `https://kauth.kakao.com/oauth/token?grant_type=refresh_token&client_id=8e90fd53b25935044191bd3ebd2bf726&&refresh_token=${refreshToken}`
      );
      console.log('토큰갱신');
      res.send({
        msg: '토큰이 성공적으로 갱신되었습니다!',
        payload: { ...data },
      });
    } catch (e: any) {
      if (e.response.status === 401 && e.response.data.code === 'A0002') {
        res.status(401).json({
          msg: 'refresh토큰이 만료되었습니다. 다시 로그인해주세요.',
        });
      } else {
        console.log('400에러');
        res.status(400).json({
          msg: '에러입니다!',
        });
      }
    }
  }
);

export default router;
