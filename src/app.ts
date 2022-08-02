import axios from 'axios';
import express, { Request, Response, NextFunction } from 'express';
import { authToken } from '../src/middleware/authToken';
import { sequelize } from './model';

const app = express();

sequelize
  .sync({ force: false })
  .then(() => console.log('데이터 베이스 연결 성공했다리요!'))
  .catch((err) => {
    console.log(err);
  });

app.get('/', (req: Request, res: Response, next: NextFunction) => {
  return res.status(200).json({ message: 'hello' });
});

app.get('/auth/kakao/callback', async (req, res, next) => {
  const { data } = await axios.post(
    `https://kauth.kakao.com/oauth/token?grant_type=authorization_code&client_id=8e90fd53b25935044191bd3ebd2bf726&&redirect_uri=http://localhost:3000/auth/kakao/callback&code=${req.query.code}`
  );

  const userInfo = await axios.get('https://kapi.kakao.com/v1/oidc/userinfo', {
    headers: {
      Authorization: `Bearer $${data.access_token}`,
    },
  });

  return res.send({ ...data, ...userInfo.data, message: '' });
});

app.get('/test', authToken, async (req, res, next) => {
  console.log(req.userId);
  return res.send({ msg: 'accessToken이 유효합니다 시빠끄', id: req.userId });
});

app.listen(3000, () => {
  console.log('running on port 3000');
});
