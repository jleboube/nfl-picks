const User = require('./User');
const Game = require('./Game');
const Pick = require('./Pick');

// Define associations
User.hasMany(Pick, { foreignKey: 'userId', as: 'picks' });
Pick.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Game.hasMany(Pick, { foreignKey: 'gameId', as: 'picks' });
Pick.belongsTo(Game, { foreignKey: 'gameId', as: 'game' });

module.exports = {
  User,
  Game,
  Pick
};