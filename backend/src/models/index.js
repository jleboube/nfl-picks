const User = require('./User');
const Game = require('./Game');
const Pick = require('./Pick');
const Group = require('./Group');
const GroupCode = require('./GroupCode');

// Define associations
User.hasMany(Pick, { foreignKey: 'userId', as: 'picks' });
Pick.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Game.hasMany(Pick, { foreignKey: 'gameId', as: 'picks' });
Pick.belongsTo(Game, { foreignKey: 'gameId', as: 'game' });

// Group associations
Group.hasMany(User, { foreignKey: 'groupId', as: 'members' });
User.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });

Group.hasMany(GroupCode, { foreignKey: 'groupId', as: 'codes' });
GroupCode.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });

module.exports = {
  User,
  Game,
  Pick,
  Group,
  GroupCode
};