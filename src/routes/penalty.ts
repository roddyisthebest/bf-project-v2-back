import express, { Response, NextFunction } from 'express';
import { Penalty } from '../model/penalty';
import { User } from '../model/user';
import { Op } from 'sequelize';
import moment from 'moment';
import { Service } from '../model/service';

const router = express.Router();

router.get('/:lastId', async (req: any, res: Response, next: NextFunction) => {
  try {
    const where = { id: {} };
    const lastId = parseInt(req.params.lastId, 10);
    if (lastId !== -1) {
      where.id = { [Op.lt]: lastId };
    }
    const penaltys = await User.findAll({
      include: [
        {
          model: Penalty,
          where: {
            weekend: { [Op.eq]: moment().day(0).format('YYYY-MM-DD') },
          },
        },
        {
          model: Service,
          where: {
            penalty: { [Op.ne]: false },
          },
          attributes: [],
        },
      ],
      order: [['id', 'DESC']],
      limit: 5,
      where: lastId === -1 ? {} : where,
    });
    if (penaltys.length === 5) {
      return res.json({
        code: 'success',
        payload: penaltys,
        msg: `${moment().day(0).format('YYYY-MM-DD')} 기간의 벌금 목록입니다.`,
      });
    } else {
      return res.json({
        code: 'last data',
        payload: penaltys,
        msg: `${moment()
          .day(0)
          .format('YYYY-MM-DD')} 기간의 마지막  벌금 목록입니다.`,
      });
    }
  } catch (e) {
    console.log(e);
    next(e);
  }
});

export default router;
