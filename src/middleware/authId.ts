import axios from 'axios';
import { Response, NextFunction } from 'express';
export const authId = async (req: any, res: Response, next: NextFunction) => {
  if (req.userId !== parseInt(req.params.id, 10)) {
    return res.status(401).json({
      msg: '잘못된 접근입니다.',
      code: 'wrong access',
    });
  }
  next();
};
