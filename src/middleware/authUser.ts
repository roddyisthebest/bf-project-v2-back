import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { User } from '../model/user';

export const authUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.userId !== parseInt(req.params.id, 10)) {
    const user = await User.findOne({
      where: { id: req.userId },
    });

    if (!user?.authenticate)
      return res.status(401).json({
        msg: '자격증명이 미이행 상태입니다. 자격증명을 해주세요.',
        code: 401,
      });
  }
  next();
};
