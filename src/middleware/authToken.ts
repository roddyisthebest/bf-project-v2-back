import axios from 'axios';
import { Request, Response, NextFunction } from 'express';

export const authToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { data } = await axios.get(
      'https://kapi.kakao.com/v1/user/access_token_info',
      {
        headers: { Authorization: `Bearer ${req.headers.accesstoken}` },
      }
    );
    console.log(data.id);
    req.userId = data.id;
    return next();
  } catch (e) {
    res.send({ msg: '에러입니다.' });
    console.log(e);
  }
};
