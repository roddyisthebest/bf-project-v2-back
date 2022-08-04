import express, { Request, Response, NextFunction } from 'express';
import { Penalty } from '../model/penalty';
import { User } from '../model/user';
import { Op } from 'sequelize';
import moment from 'moment';
import { authToken } from '../middleware/authToken';
import { Pray } from '../model/pray';
const router = express.Router();

router.get(
  '/',
  authToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prayList = await User.findAll({
        where: { admin: { [Op.not]: true } },
        attributes: ['id', 'img', 'name', 'weekend', 'admin'],
        include: [
          {
            model: Pray,
            where: {
              weekend: { [Op.eq]: moment().day(0).format('YYYY-MM-DD') },
            },
            order: [['createdAt', 'DESC']],
          },
        ],
      });
      res.json({
        code: 200,
        payload: prayList,
        msg: `${moment()
          .day(0)
          .format('YYYY-MM-DD')} 기간의 기도제목 목록입니다.`,
      });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.get(
  '/:weekend',
  authToken,
  async (req: Request, res: Response, next: NextFunction) => {
    const { weekend } = req.params;
    try {
      const prayList = await User.findAll({
        where: { admin: { [Op.not]: true } },
        attributes: ['id', 'img', 'name'],
        include: [
          {
            model: Pray,
            where: {
              weekend: { [Op.eq]: weekend },
            },
            order: [['createdAt', 'DESC']],
          },
        ],
      });
      res.json({
        code: 200,
        payload: prayList,
        msg: `${weekend} 기간의 기도제목 목록입니다.`,
      });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.get(
  '/check/:weekend',
  authToken,
  async (req: Request, res: Response, next: NextFunction) => {
    const { weekend } = req.params;
    try {
      const prayList = await Pray.findAll({
        where: { weekend: { [Op.eq]: weekend } },
      });

      if (prayList.length === 0) {
        return res.json({
          code: 200,
          msg: `${weekend} 기간의 기도제목이 존재합니다.`,
        });
      } else {
        return res.status(404).json({
          code: 404,
          msg: `${weekend} 기간의 기도제목이 존재하지 않습니다.`,
        });
      }
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

export default router;
