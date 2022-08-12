import axios from 'axios';
import express, { Request, Response, NextFunction } from 'express';
import { authToken } from '../src/middleware/authToken';
import { authUser } from './middleware/authUser';
import { sequelize } from './model';
import dotenv from 'dotenv';
import userRoutes from '../src/routes/user';
import prayRoutes from '../src/routes/pray';
import penaltyRoutes from '../src/routes/penalty';
import tweetRoutes from '../src/routes/tweet';
import tokenRoutes from '../src/routes/token';
import path from 'path';
import cors from 'cors';
import { update } from './util/update';

const app = express();
dotenv.config();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'uploads')));
sequelize
  .sync({ force: false })
  .then(() => console.log('데이터 베이스 연결 성공했다리요!'))
  .catch((err) => {
    console.log(err);
  });

update();

app.get('/', (req: Request, res: Response, next: NextFunction) => {
  return res.status(200).json({ message: 'hello' });
});
app.use('/user', userRoutes);
app.use('/pray', authToken, authUser, prayRoutes);
app.use('/penalty', authToken, authUser, penaltyRoutes);
app.use('/tweet', authToken, authUser, tweetRoutes);
app.use('/token', tokenRoutes);
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
