const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Game = sequelize.define('Game', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  homeTeam: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'home_team'
  },
  awayTeam: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'away_team'
  },
  homeScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'home_score'
  },
  awayScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'away_score'
  },
  gameTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'game_time'
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_completed'
  },
  externalId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'external_id'
  }
}, {
  tableName: 'games',
  underscored: true,
  indexes: [
    {
      fields: ['week_number']
    },
    {
      fields: ['game_time']
    },
    {
      fields: ['is_completed']
    }
  ]
});

Game.prototype.getWinner = function() {
  if (!this.isCompleted || this.homeScore === null || this.awayScore === null) {
    return null;
  }
  return this.homeScore > this.awayScore ? this.homeTeam : this.awayTeam;
};

module.exports = Game;