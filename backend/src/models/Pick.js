const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pick = sequelize.define('Pick', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  weekNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'week_number',
    validate: {
      min: 1,
      max: 18
    }
  },
  gameId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'game_id',
    references: {
      model: 'games',
      key: 'id'
    }
  },
  selectedTeam: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'selected_team'
  },
  isCorrect: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    field: 'is_correct'
  }
}, {
  tableName: 'picks',
  underscored: true,
  indexes: [
    {
      fields: ['user_id', 'week_number']
    },
    {
      fields: ['user_id', 'game_id'],
      unique: true
    },
    {
      fields: ['week_number']
    }
  ]
});

module.exports = Pick;