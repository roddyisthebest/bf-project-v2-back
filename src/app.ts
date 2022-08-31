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
import socket from './socket';
import admin from 'firebase-admin';
import { User } from './model/user';
import { Tweet } from './model/tweet';
import { Op } from 'sequelize';
import moment from 'moment';
import schedule from 'node-schedule';
import { userId } from './middleware/authToken';
import fs from 'fs';
import https from 'https';

const HTTP_PORT = 8080;
const HTTPS_PORT = 8443;

const options = {
  key: fs.readFileSync('src/localhost-key.pem'),
  cert: fs.readFileSync('src/localhost.pem'),
};

const app = express();
let phoneToken: string = '';
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
app.get('/', (req: Request, res: Response, next: NextFunction) => {
  console.log(req.secure);
  return res.status(200).json({ message: 'hello' });
});
app.use('/user', userRoutes);
app.use('/pray', authToken, authUser, prayRoutes);
app.use('/penalty', authToken, authUser, penaltyRoutes);
app.use('/tweet', authToken, authUser, tweetRoutes);
app.use('/token', tokenRoutes);

app.post('/phonetoken', (req, res, next) => {
  phoneToken = req.body.token;
  console.log(phoneToken);
  res.send('ok');
});

const alarm = () =>
  schedule.scheduleJob('0 0 0 * * SUN', async function () {
    try {
      const user = await User.findOne({ where: { id: userId } });

      const alreadyTweet = await Tweet.findOne({
        where: {
          UserId: userId,
          createdAt: {
            [Op.between]: [
              moment().format('YYYY-MM-DD 00:00'),
              moment().format('YYYY-MM-DD 23:59'),
            ],
          },
        },
      });
      console.log('예수님의 사랑으로');
      // 푸시 알림 관련 코드 기재
      console.log(phoneToken.length);
      if (phoneToken.length !== 0 && !alreadyTweet) {
        admin
          .messaging()
          .send({
            token: phoneToken,
            notification: {
              title: '매일성경 알림 ⚠️',
              body: `${user?.name}님 매일성경 게시글을 올려주세요. 30분 남았답니다.`,
            },
            android: {
              notification: {
                channelId: '기타',
                vibrateTimingsMillis: [0, 500, 500, 500],
                priority: 'high',
                defaultVibrateTimings: false,
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  category: '기타',
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

alarm();

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

const server = https.createServer(options, app).listen(HTTPS_PORT);

// const server = app.listen(3000, () => {
//   console.log('running on port 3000');
// });

socket(server);
