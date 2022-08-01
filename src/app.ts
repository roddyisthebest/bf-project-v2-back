import express, { Request, Response, NextFunction } from 'express';

const app = express();

app.get('/', (req: Request, res: Response, next: NextFunction) => {
  return res.status(200).json({ message: 'hello' });
});

app.listen(3000, () => {
  console.log('running on port 3000');
});
