const express = require('express');
const bcrypt = require('bcryptjs');
const { User, Group, GroupCode } = require('../models');
const { generateToken } = require('../utils/jwt');
const auth = require('../middleware/auth');

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  console.log('🧪 Auth test endpoint hit!');
  res.json({ message: 'Auth routes are working!' });
});

// Register
router.post('/register', async (req, res) => {
  console.log('🚀 Register endpoint hit!', { body: req.body });
  try {
    const { username, email, password, groupCode } = req.body;
    
    if (!username || !email || !password || !groupCode) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ message: 'Username, email, password, and group code are required' });
    }

    // Validate group code
    console.log('🔍 Validating group code:', groupCode);
    const codeRecord = await GroupCode.findOne({
      where: { code: groupCode },
      include: [{
        model: Group,
        as: 'group'
      }]
    });

    if (!codeRecord) {
      console.log('❌ Invalid group code');
      return res.status(400).json({ message: 'Invalid group code' });
    }

    if (!codeRecord.isValid()) {
      console.log('❌ Group code expired or inactive');
      return res.status(400).json({ message: 'Group code is expired or inactive' });
    }

    // Check if user already exists
    const { Op } = require('sequelize');
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email 
          ? 'User with this email already exists'
          : 'Username already taken'
      });
    }

    // Check group member limit
    if (codeRecord.group.maxMembers) {
      const memberCount = await User.count({
        where: { groupId: codeRecord.groupId }
      });
      
      if (memberCount >= codeRecord.group.maxMembers) {
        console.log('❌ Group is full');
        return res.status(400).json({ message: 'Group is full' });
      }
    }

    // Hash password manually
    console.log('🔒 Hashing password manually...');
    const passwordHash = await bcrypt.hash(password, 12);
    console.log('✅ Password hashed, creating user...');
    
    // Create user
    const user = await User.create({
      username,
      email,
      passwordHash,
      groupId: codeRecord.groupId
    });

    // Increment code usage
    await codeRecord.increment('usageCount');
    console.log('📈 Code usage incremented');

    const token = generateToken(user.id);
    console.log('✅ User created successfully:', user.username, 'in group:', codeRecord.group.name);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: user.toJSON(),
      group: codeRecord.group
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    res.json(req.user.toJSON());
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;