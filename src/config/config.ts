import dotenv from 'dotenv';
dotenv.config();

export default {
  development: {
    username: 'root',
    password: 'bsy30228',
    database: 'bf2',
    host: '127.0.0.1',
    dialect: 'mysql',
    timezone: '+09:00',
  },
};
