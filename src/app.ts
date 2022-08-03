import axios from 'axios';
import express, { Request, Response, NextFunction } from 'express';
import { authToken } from '../src/middleware/authToken';
import { sequelize } from './model';
import dotenv from 'dotenv';
import userRoutes from '../src/routes/user';
const app = express();
dotenv.config();
app.use(express.json());

sequelize
  .sync({ force: false })
  .then(() => console.log('데이터 베이스 연결 성공했다리요!'))
  .catch((err) => {
    console.log(err);
  });

app.get('/', (req: Request, res: Response, next: NextFunction) => {
  return res.status(200).json({ message: 'hello' });
});
app.use('/user', userRoutes);

// app.get('/auth/kakao/callback', async (req, res, next) => {
//   const { data } = await axios.post(
//     `https://kauth.kakao.com/oauth/token?grant_type=authorization_code&client_id=8e90fd53b25935044191bd3ebd2bf726&&redirect_uri=http://localhost:3000/auth/kakao/callback&code=${req.query.code}`
//   );

//   const userInfo = await axios.get('https://kapi.kakao.com/v1/oidc/userinfo', {
//     headers: {
//       Authorization: `Bearer $${data.access_token}`,
//     },
//   });

//   return res.send({ ...data, ...userInfo.data, message: '' });
// });

app.get('/test', authToken, async (req, res, next) => {
  console.log(req.userId);
  return res.send({ msg: 'accessToken이 유효합니다 시빠끄', id: req.userId });
});

app.post(
  '/accessToken',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(req.body);
      const { refreshToken }: { refreshToken: string } = req.body;
      const { data } = await axios.post(
        `https://kauth.kakao.com/oauth/token?grant_type=refresh_token&client_id=8e90fd53b25935044191bd3ebd2bf726&&refresh_token=${refreshToken}`
      );
      res.send({
        msg: '토큰이 성공적으로 갱신되었습니다!',
        data,
      });
    } catch (e) {
      console.log(e);
    }
  }
);

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  next(error);
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'prod' ? err : {};
  res.status(500);
  res.json({ err });
});

app.listen(3000, () => {
  console.log('running on port 3000');
});
