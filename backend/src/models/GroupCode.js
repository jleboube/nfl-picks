const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GroupCode = sequelize.define('GroupCode', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [6, 20]
    }
  },
  groupId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'group_id',
    references: {
      model: 'groups',
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'usage_count'
  },
  maxUsage: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'max_usage'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at'
  }
}, {
  tableName: 'group_codes',
  underscored: true,
  indexes: [
    {
      fields: ['code'],
      unique: true
    },
    {
      fields: ['group_id']
    },
    {
      fields: ['is_active']
    }
  ]
});

GroupCode.prototype.isValid = function() {
  const now = new Date();
  
  // Check if code is active
  if (!this.isActive) return false;
  
  // Check if code has expired
  if (this.expiresAt && now > this.expiresAt) return false;
  
  // Check if usage limit reached
  if (this.maxUsage && this.usageCount >= this.maxUsage) return false;
  
  return true;
};

module.exports = GroupCode;