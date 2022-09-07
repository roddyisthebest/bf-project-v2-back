import axios from 'axios';
import { Response, NextFunction } from 'express';
import { User } from '../model/user';
import { UserIdRequest } from '../types/userIdRequest';

export const authUser = async (
  req: UserIdRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.userId !== parseInt(req.params.id, 10)) {
    const user = await User.findOne({
      where: { id: req.userId },
    });

    if (!user?.authenticate)
      return res.status(403).json({
        msg: '자격증명이 미이행 상태입니다. 자격증명을 해주세요.',
        code: 'forbidden',
      });
  }
  next();
};
