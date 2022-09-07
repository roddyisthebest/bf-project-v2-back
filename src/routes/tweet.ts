import express, { Response, NextFunction } from 'express';
import { Penalty } from '../model/penalty';
import { User } from '../model/user';
import { Op } from 'sequelize';
import moment from 'moment';
import { authToken } from '../middleware/authToken';
import { authUser } from '../middleware/authUser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sanitizeHtml from 'sanitize-html';
import { Tweet } from '../model/tweet';
import userType from '../types/user';
import { Service } from '../model/service';
import { UserIdRequest } from '../types/userIdRequest';
const router = express.Router();

try {
  fs.readdirSync('src/uploads');
} catch (error) {
  fs.mkdirSync('src/uploads');
}

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, `src/uploads`);
    },
    filename(req, file, cb) {
      console.log(file);
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post(
  '/',
  upload.single('img'),
  async (req: UserIdRequest, res: Response, next: NextFunction) => {
    console.log('wow!');
    try {
      const user: any = await User.findOne({
        where: { id: req.userId },
        include: [{ model: Service }],
      });

      const img = req.file?.path || ('' as string);
      const { content: pureContent } = req.body;
      const content = sanitizeHtml(pureContent);

      let error = false;

      if (!(img || content)) {
        return res
          .status(400)
          .json({ msg: '잘못된 형식의 data입니다.', code: 'bad request' });
      }

      if (!user.Service.tweet) {
        fs.unlink(img, (err) => (err ? (error = true) : (error = false)));
        if (error) {
          return res
            .status(500)
            .json({ code: 'server error', message: '파일 삭제 오류입니다.' });
        } else {
          return res.status(403).json({
            code: 'forbidden',
            msg: `${user.name}님은 게시글을 업로드하는 서비스를 이용하지 않으셨습니다.`,
          });
        }
      }

      const alreadyTweet = await Tweet.findOne({
        where: {
          UserId: req.userId,
          createdAt: {
            [Op.between]: [
              moment().format('YYYY-MM-DD 00:00'),
              moment().format('YYYY-MM-DD 23:59'),
            ],
          },
        },
      });

      if (alreadyTweet) {
        fs.unlink(img, (err) => (err ? (error = true) : (error = false)));
        if (error) {
          return res
            .status(500)
            .json({ code: 'server error', msg: '파일 삭제 오류입니다.' });
        } else {
          return res.status(406).json({
            code: 'forbidden',
            msg: '오늘 업로드 된 게시물이 존재합니다.',
          });
        }
      }

      await Tweet.create({
        UserId: req.userId,
        content: content && content,
        img: img && img.replace('uploads', 'img'),
        weekend: moment().day(0).format('YYYY-MM-DD'),
      });

      return res.json({
        code: 'success',
        msg: '성공적으로 업로드 되었습니다.',
      });
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  '/:lastId',
  async (req: UserIdRequest, res: Response, next: NextFunction) => {
    try {
      const where = { id: {} };
      const lastId = parseInt(req.params.lastId, 10);

      if (lastId !== -1) {
        where.id = { [Op.lt]: lastId };
      }

      const tweets = await Tweet.findAll({
        where: lastId === -1 ? {} : where,
        limit: 5,
        order: [['createdAt', 'DESC']],
        include: [{ model: User, attributes: ['id', 'name', 'img', 'oauth'] }],
      });
      if (tweets.length === 5) {
        return res.json({ code: 'success', payload: tweets });
      } else {
        return res.json({
          code: 'last data',
          payload: tweets,
          msg: '마지막 page의 게시글 목록 입니다.',
        });
      }
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
);

router.delete(
  '/:id',
  async (req: UserIdRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
      const tweet: any = await Tweet.findOne({
        where: { id },
        include: [{ model: User, attributes: ['id'] }],
      });

      const user: userType = tweet?.User;

      var error = false;

      if (req.userId === (user.id as number)) {
        await Tweet.destroy({ where: { id } });
        if (tweet.img.length != 0) {
          fs.unlink(tweet?.img.replace('img', 'uploads'), (err) =>
            err ? (error = true) : console.log('good')
          );
        }

        if (!error) {
          return res.json({
            code: 'success',
            message: '해당 트윗의 삭제가 완료되었습니다!',
          });
        } else {
          return res.status(404).send({ code: 'not found', msg: error });
        }
      } else {
        return res
          .status(403)
          .json({ code: 'forbidden', msg: '권한이 없습니다. 꺼지세요' });
      }
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
);

export default router;
