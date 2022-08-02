import { DataTypes, Model, Sequelize } from 'sequelize';
import { User } from './user';

interface PenaltyAttributes {
  id: number;
  paper: number;
  weekend: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class Penalty extends Model<PenaltyAttributes> {
  static associate() {
    this.belongsTo(User);
  }
}

const penaltyInit = (sequelize: Sequelize) =>
  Penalty.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      paper: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: false,
        defaultValue: 0,
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
      modelName: 'Penalty',
      tableName: 'penaltys',
      paranoid: true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    }
  );

export { penaltyInit, Penalty };