const express = require('express');
const { Group, GroupCode, User } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// Create a new group
router.post('/groups', async (req, res) => {
  try {
    const { name, description, maxMembers } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const group = await Group.create({
      name,
      description,
      maxMembers
    });

    res.status(201).json({
      message: 'Group created successfully',
      group
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a group code
router.post('/group-codes', async (req, res) => {
  try {
    const { code, groupId, maxUsage, expiresAt } = req.body;
    
    if (!code || !groupId) {
      return res.status(400).json({ message: 'Code and group ID are required' });
    }

    // Check if group exists
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const groupCode = await GroupCode.create({
      code,
      groupId,
      maxUsage,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    res.status(201).json({
      message: 'Group code created successfully',
      groupCode,
      group
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Code already exists' });
    }
    console.error('Error creating group code:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// List all groups
router.get('/groups', async (req, res) => {
  try {
    const groups = await Group.findAll({
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'username', 'email', 'createdAt']
        },
        {
          model: GroupCode,
          as: 'codes',
          attributes: ['id', 'code', 'usageCount', 'maxUsage', 'isActive', 'expiresAt']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get group by ID
router.get('/groups/:id', async (req, res) => {
  try {
    const group = await Group.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'username', 'email', 'createdAt']
        },
        {
          model: GroupCode,
          as: 'codes'
        }
      ]
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Quick setup endpoint - creates a group and code in one call
router.post('/quick-setup', async (req, res) => {
  try {
    const { groupName, groupDescription, code, maxMembers, maxUsage } = req.body;
    
    if (!groupName || !code) {
      return res.status(400).json({ message: 'Group name and code are required' });
    }

    // Create group
    const group = await Group.create({
      name: groupName,
      description: groupDescription,
      maxMembers
    });

    // Create code for the group
    const groupCode = await GroupCode.create({
      code,
      groupId: group.id,
      maxUsage
    });

    res.status(201).json({
      message: 'Group and code created successfully',
      group,
      code: groupCode
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Code already exists' });
    }
    console.error('Error in quick setup:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;