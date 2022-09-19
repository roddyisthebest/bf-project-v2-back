import { Request } from 'express';
export interface any extends Request {
  userId: number;
}
