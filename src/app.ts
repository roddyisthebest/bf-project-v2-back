import axios from 'axios';
import express, { Response, NextFunction } from 'express';
import { UserIdRequest } from './types/userIdRequest';
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
import socket from './socket';
import admin from 'firebase-admin';
import { User } from './model/user';
import { Tweet } from './model/tweet';
import { Op } from 'sequelize';
import moment from 'moment';
import schedule from 'node-schedule';
import jwt from 'jsonwebtoken';
import https from 'https';
const HTTP_PORT = 3000;
const HTTPS_PORT = 443;

const app = express();
dotenv.config();

process.env.GOOGLE_APPLICATION_CREDENTIALS =
  'src/bf-project-v2-firebase-adminsdk-tpz69-15abf50c1c.json';

admin.initializeApp({
  credential: admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  databaseURL: 'https://bf-project-v2.firebaseio.com',
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/src/img', express.static(path.join(__dirname, 'uploads')));
sequelize
  .sync({ force: false })
  .then(() => console.log('데이터 베이스 연결 성공했다리요!'))
  .catch((err) => {
    console.log(err);
  });

update();
app.get('/', (req: UserIdRequest, res: Response, next: NextFunction) => {
  console.log(req.secure);
  return res.status(200).json({ message: 'hello' });
});
app.use('/user', userRoutes);
app.use('/pray', authToken, authUser, prayRoutes);
app.use('/penalty', authToken, authUser, penaltyRoutes);
app.use('/tweet', authToken, authUser, tweetRoutes);
app.use('/token', tokenRoutes);

const alarm = () =>
  schedule.scheduleJob('0 30 23 * * *', async function () {
    // 푸시 알림 관련 코드 기재

    try {
      const userList = await User.findAll();

      userList.map(async (e: any) => {
        try {
          const alreadyTweet = await Tweet.findOne({
            where: {
              UserId: e.id,
              createdAt: {
                [Op.between]: [
                  moment().format('YYYY-MM-DD 00:00'),
                  moment().format('YYYY-MM-DD 23:59'),
                ],
              },
            },
          });

          if (e.phoneToken.length !== 0 && !alreadyTweet) {
            admin
              .messaging()
              .send({
                token: e.phoneToken,
                notification: {
                  title: '매일성경 알림 ⚠️',
                  body: `${e?.name}님 매일성경 게시글을 올려주세요. 30분 남았답니다.`,
                },
                android: {
                  notification: {
                    channelId: 'default',
                    vibrateTimingsMillis: [0, 500, 500, 500],
                    priority: 'high',
                    defaultVibrateTimings: false,
                  },
                },
                apns: {
                  payload: {
                    aps: {
                      sound: 'default',
                      category: 'default',
                    },
                  },
                },
              })
              .then((e) => console.log(e))
              .catch(console.error);
          }
        } catch (e) {
          console.log(e);
        }
      });
    } catch (e) {
      console.log(e);
    }
  });

alarm();

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  next(error);
});

app.use((err: Error, req: UserIdRequest, res: Response, next: NextFunction) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'prod' ? err : {};
  res.status(500);
  res.json({ err });
});

let server;

if (process.env.NODE_ENV === 'prod') {
  const lex = require('greenlock-express').create({
    version: 'draft-11',
    configDir: '/etc/letsencrypt',
    server: 'https://acme-v02.api.letsencrypt.org/directory',
    email: 'bsy17171@naver.com',
    agreeTos: true,
    approvedDomains: ['api.bf-church.click'],
    renewWithin: 81 * 24 * 60 * 60 * 1000,
    renewBy: 80 * 24 * 60 * 60 * 1000,
  });

  server = https
    .createServer(lex.httpsOptions, lex.middleware(app))
    .listen(HTTPS_PORT, () => {
      console.log(`running on port ${HTTPS_PORT}`);
    });
} else {
  server = app.listen(HTTP_PORT, () => {
    console.log(`running on port ${HTTP_PORT}`);
  });
}

socket(server);

const generateAccessToken = (id: number) => {
  return jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET as string, {
    expiresIn: '1 days',
  });
};

const generateRefreshToken = (id: number) => {
  return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET as string, {
    expiresIn: '180 days',
  });
};

export { generateAccessToken, generateRefreshToken };
