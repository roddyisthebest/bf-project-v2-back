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
    req.userId = data.id;
    return next();
  } catch (e: any) {
    console.log(e.response);
    if (e.response.status === 401) {
      return res.send({
        msg: '토큰이 만료되었습니다.',
        code: e.response.status,
      });
    }

    console.log(e);
  }
};
