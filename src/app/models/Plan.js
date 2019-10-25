import Sequelize, { Model } from 'sequelize';

class Plan extends Model {
  static init(sequelize) {
    super.init(
      {
        title: Sequelize.STRING,
        duration: Sequelize.INTEGER,
        price: Sequelize.DECIMAL(16, 2),
      },
      {
        sequelize,
      }
    );

    return this;
  }
}

export default Plan;
