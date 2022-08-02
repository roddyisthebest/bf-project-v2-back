import { DataTypes, Model, Sequelize } from 'sequelize';
import { User } from './user';

interface TweetAttributes {
  id: number;
  content: string;
  img: string;
  weekend: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class Tweet extends Model<TweetAttributes> {
  static associate() {
    this.belongsTo(User);
  }
}

const tweetInit = (sequelize: Sequelize) =>
  Tweet.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: false,
        primaryKey: true,
      },
      content: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false,
      },
      img: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
      weekend: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
    },
    {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'Tweet',
      tableName: 'tweets',
      paranoid: true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    }
  );

export { tweetInit, Tweet };