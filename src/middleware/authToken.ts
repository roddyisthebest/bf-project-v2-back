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
    if (e.response.data.code === -401) {
      return res.status(401).send({
        msg: '토큰 값이 잘못되었거나 만료되어 유효하지 않은 경우로 토큰 갱신이 필요합니다.',
        code: 401,
      });
    } else if (e.response.data.code === -2) {
      return res.status(400).send({
        msg: '필수 인자가 포함되지 않았거나 호출 인자값의 데이터 타입이 적절하지 않았거나 허용된 범위를 벗어났습니다.',
        code: 400,
      });
    } else if (e.response.data.code === -1) {
      return res.status(400).send({
        msg: '카카오 플랫폼 서비스의 일시적 내부 장애가 발생하였습니다. 잠시만 기다려주세요.',
        code: 403,
      });
    }

    console.log(e);
  }
};
