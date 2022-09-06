import express, { Request, Response, NextFunction } from 'express';
import { User } from '../model/user';
import { Op } from 'sequelize';
import moment from 'moment';
import { Pray } from '../model/pray';
import sanitizeHtml from 'sanitize-html';
import { Service } from '../model/service';

const router = express.Router();

router.get(
  '/:lastId',
  async (req: Request, res: Response, next: NextFunction) => {
    const where = { id: {}, admin: { [Op.not]: true } };
    const lastId = parseInt(req.params.lastId, 10);
    if (lastId !== -1) {
      where.id = { [Op.lt]: lastId };
    }

    try {
      const userList = await User.findAll({
        where: lastId === -1 ? {} : where,
        limit: 5,
        attributes: ['id', 'img', 'name'],
        order: [['id', 'DESC']],
        include: [
          {
            model: Service,
            where: {
              pray: { [Op.ne]: false },
            },
            attributes: [],
          },
        ],
      });
      const filteredPrayList = [...userList];
      for (let i = 0; i < userList.length; i++) {
        const prayList = await Pray.findAll({
          where: {
            UserId: userList[i].id,
            weekend: { [Op.eq]: moment().day(0).format('YYYY-MM-DD') },
          },
        });
        filteredPrayList[i].dataValues.Prays = prayList?.length ? prayList : [];
      }

      if (filteredPrayList.length === 5) {
        return res.json({
          code: 'success',
          payload: filteredPrayList,
          msg: `${moment()
            .day(0)
            .format('YYYY-MM-DD')} 기간의 기도제목 목록입니다.`,
        });
      } else {
        console.log(filteredPrayList);
        return res.json({
          code: 'last data',
          payload: filteredPrayList,
          msg: `${moment()
            .day(0)
            .format('YYYY-MM-DD')} 기간의 마지막 기도제목 목록입니다.`,
        });
      }
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.get(
  '/:lastId/weekend/:weekend',
  async (req: Request, res: Response, next: NextFunction) => {
    const { weekend } = req.params;
    const where = { id: {}, admin: { [Op.not]: true } };

    const lastId = parseInt(req.params.lastId, 10);
    if (lastId !== -1) {
      where.id = { [Op.lt]: lastId };
    }
    try {
      const prayList = await User.findAll({
        where: lastId === -1 ? {} : where,
        attributes: ['id', 'img', 'name'],
        order: [['id', 'DESC']],
        limit: 5,
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
      if (prayList.length === 5) {
        return res.json({
          code: 'success',
          payload: prayList,
          msg: `${moment()
            .day(0)
            .format('YYYY-MM-DD')} 기간의 기도제목 목록입니다.`,
        });
      } else {
        return res.json({
          code: 'last data',
          payload: prayList,
          msg: `${moment()
            .day(0)
            .format('YYYY-MM-DD')} 기간의 마지막 기도제목 목록입니다.`,
        });
      }
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.get(
  '/weekend/:weekend/check',
  async (req: Request, res: Response, next: NextFunction) => {
    const { weekend } = req.params;
    try {
      const prayList = await Pray.findAll({
        where: { weekend: { [Op.eq]: weekend } },
        limit: 1,
      });

      if (prayList.length !== 0) {
        return res.json({
          code: 'exist',
          msg: `${weekend} 기간의 기도제목이 존재합니다.`,
        });
      } else {
        return res.status(202).json({
          code: 'not exist',
          msg: `${weekend} 기간의 기도제목이 존재하지 않습니다.`,
        });
      }
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const { content: pureContent, id } = req.body;
  const content = sanitizeHtml(pureContent);

  try {
    const user: any = await User.findOne({
      where: { id },
      include: [{ model: Service, where: { pray: { [Op.ne]: false } } }],
    });

    if (!user) {
      return res.status(403).json({
        code: 'forbidden',
        msg: '회원님은 기도제목 서비스를 이용하지 않으셨습니다.',
      });
    }

    const pray: any = await Pray.create({
      UserId: user.id,
      weekend: moment().day(0).format('YYYY-MM-DD'),
      content,
    });
    return res.json({
      code: 'success',
      msg: '형제자매님의 기도제목이 성공적으로 db에 저장되었으니 기도해주세요.',
      payload: {
        id: pray.id,
        weekend: pray.weekend,
        content: pray.content,
      },
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
});

router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  const { id, content: pureContent, userId } = req.body;
  console.log(req.body);
  const content = sanitizeHtml(pureContent);

  try {
    const user: any = await User.findOne({
      where: { id: userId },
      include: [{ model: Service, where: { pray: { [Op.ne]: false } } }],
    });

    if (!user) {
      return res.status(403).json({
        code: 'forbidden',
        msg: '회원님은 기도제목 서비스를 이용하지 않으셨습니다.',
      });
    }
    await Pray.update({ content }, { where: { id } });
    return res.send({
      code: 'success',
      msg: '유저의 기도제목이 성공적으로 변경되었습니다.',
    });
  } catch (e) {
    next(e);
  }
});

router.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
      await Pray.destroy({ where: { id } });
      return res.json({
        code: 'success',
        msg: '해당 기도제목의 삭제가 완료되었습니다!',
      });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
);
export default router;
