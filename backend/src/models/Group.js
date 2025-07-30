const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Group = sequelize.define('Group', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  maxMembers: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'max_members',
    validate: {
      min: 1
    }
  }
}, {
  tableName: 'groups',
  underscored: true,
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['is_active']
    }
  ]
});

module.exports = Group;