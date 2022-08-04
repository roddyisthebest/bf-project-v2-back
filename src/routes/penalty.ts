import express, { Request, Response, NextFunction } from 'express';
import { Penalty } from '../model/penalty';
import { User } from '../model/user';
import { Op } from 'sequelize';
import moment from 'moment';
import { authToken } from '../middleware/authToken';
const router = express.Router();

router.get(
  '/',
  authToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const penaltys = await Penalty.findAll({
        include: {
          model: User,
          where: {
            admin: { [Op.not]: true },
            weekend: { [Op.eq]: moment().day(0).format('YYYY-MM-DD') },
          },
          attributes: ['id', 'img', 'name', 'weekend'],
        },
      });

      res.json({
        code: 200,
        payload: penaltys,
        msg: `${moment().day(0).format('YYYY-MM-DD')} 기간의 벌금 목록입니다.`,
      });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

export default router;
