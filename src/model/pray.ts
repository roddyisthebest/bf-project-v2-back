import { DataTypes, Model, Sequelize } from 'sequelize';
import { User } from './user';

interface PrayAttributes {
  id: number;
  content: string;
  weekend: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class Pray extends Model<PrayAttributes> {
  static associate() {
    this.belongsTo(User);
  }
}

const prayInit = (sequelize: Sequelize) =>
  Pray.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: false,
        primaryKey: true,
      },
      content: {
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
      modelName: 'Pray',
      tableName: 'prays',
      paranoid: true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    }
  );

export { prayInit, Pray };