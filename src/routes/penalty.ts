import express, { Request, Response, NextFunction } from 'express';
import { Penalty } from '../model/penalty';
import { User } from '../model/user';
import { Op } from 'sequelize';
import moment from 'moment';

const router = express.Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const penaltys = await User.findAll({
      include: {
        model: Penalty,
        where: {
          weekend: { [Op.eq]: moment().day(0).format('YYYY-MM-DD') },
        },
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
});

export default router;
