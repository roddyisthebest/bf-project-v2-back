import axios from 'axios';
import express, { Request, Response, NextFunction } from 'express';
import { authToken } from '../middleware/authToken';
const router = express.Router();

router.post(
  '/authenticate',
  authToken,
  async (req: Request, res: Response, next: NextFunction) => {
    return res.send({ msg: 'accessToken이 유효합니다.', id: req.userId });
  }
);

router.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data } = await axios.post(
        `https://kauth.kakao.com/oauth/token?grant_type=refresh_token&client_id=8e90fd53b25935044191bd3ebd2bf726&&refresh_token=${req.headers.refreshToken}`
      );
      res.send({
        msg: '토큰이 성공적으로 갱신되었습니다!',
        data,
      });
    } catch (e) {
      next(e);
      console.log(e);
    }
  }
);

export default router;
