import { DataTypes, Model, Sequelize } from 'sequelize';
import { sequelize } from '.';
import { Penalty } from './penalty';
import { Pray } from './pray';
import { Service } from './service';
import { Tweet } from './tweet';

export interface UsersAttributes {
  id: number;
  oauth: string;
  userId: string;
  authenticate: boolean;
  name: string;
  img: string;
  password: string | null;
  admin: boolean;
  payed: boolean;
  phoneToken: string;
  createdAt?: Date;
  updatedAt?: Date;
  [x: string]: any;
}
class User extends Model<UsersAttributes> {
  [x: string]: any;
  static associate() {
    this.hasMany(Tweet);
    this.hasMany(Penalty);
    this.hasMany(Pray);
    this.hasOne(Service);
    this.belongsToMany(this, {
      foreignKey: 'followingId',
      as: 'Followers',
      through: 'Follow',
      onDelete: 'cascade',
    });
    this.belongsToMany(this, {
      foreignKey: 'followerId',
      as: 'Followings',
      through: 'Follow',
      onDelete: 'cascade',
    });
  }
}

const userInit = (sequelize: Sequelize) => {
  return User.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: false,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false,
      },
      oauth: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
      authenticate: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        unique: false,
        defaultValue: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
      img: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false,
      },
      admin: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        unique: false,
        defaultValue: false,
      },
      payed: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        unique: false,
        defaultValue: false,
      },
      phoneToken: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false,
      },
    },
    {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'User',
      tableName: 'users',
      paranoid: true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    }
  );
};

export { userInit, User };
