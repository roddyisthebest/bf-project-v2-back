import { DataTypes, Model, Sequelize } from 'sequelize';
import { User } from './user';

interface ServiceAttributes {
  id: number;
  tweet: boolean;
  pray: boolean;
  penalty: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

class Service extends Model<ServiceAttributes> {
  static associate() {
    this.belongsTo(User, {
      onDelete: 'cascade',
    });
  }
}

const serviceInit = (sequelize: Sequelize) =>
  Service.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      tweet: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        unique: false,
        defaultValue: false,
      },
      pray: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        unique: false,
        defaultValue: false,
      },
      penalty: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        unique: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'Service',
      tableName: 'services',
      paranoid: true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    }
  );

export { Service, serviceInit };
