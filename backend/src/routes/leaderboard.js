const express = require('express');
const { Pick, User, Game } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');

const router = express.Router();

// Get overall season leaderboard (group-scoped)
router.get('/', auth, async (req, res) => {
  try {
    // Get current user's group
    const currentUser = await User.findByPk(req.user.id);
    
    const leaderboard = await Pick.findAll({
      attributes: [
        'userId',
        [Pick.sequelize.fn('COUNT', Pick.sequelize.col('Pick.id')), 'totalPicks'],
        [Pick.sequelize.fn('SUM', Pick.sequelize.literal('CASE WHEN is_correct = true THEN 1 ELSE 0 END')), 'totalCorrect']
      ],
      include: [{
        model: User,
        as: 'user',
        attributes: ['username'],
        where: {
          groupId: currentUser.groupId // Only users in the same group
        }
      }],
      where: {
        isCorrect: {
          [Op.not]: null // Only include scored picks
        }
      },
      group: ['Pick.userId', 'user.id', 'user.username'],
      order: [[Pick.sequelize.literal('totalCorrect'), 'DESC']],
      raw: false
    });

    const formattedLeaderboard = leaderboard.map(entry => ({
      userId: entry.userId,
      username: entry.user.username,
      totalCorrect: parseInt(entry.get('totalCorrect')) || 0,
      totalPicks: parseInt(entry.get('totalPicks')) || 0
    }));

    res.json(formattedLeaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get weekly leaderboard (group-scoped)
router.get('/week/:week', auth, async (req, res) => {
  try {
    const week = parseInt(req.params.week);
    
    if (week < 1 || week > 18) {
      return res.status(400).json({ message: 'Invalid week number' });
    }

    // Get current user's group
    const currentUser = await User.findByPk(req.user.id);

    const weeklyLeaderboard = await Pick.findAll({
      attributes: [
        'userId',
        [Pick.sequelize.fn('COUNT', Pick.sequelize.col('Pick.id')), 'weeklyPicks'],
        [Pick.sequelize.fn('SUM', Pick.sequelize.literal('CASE WHEN is_correct = true THEN 1 ELSE 0 END')), 'weeklyCorrect']
      ],
      include: [{
        model: User,
        as: 'user',
        attributes: ['username'],
        where: {
          groupId: currentUser.groupId // Only users in the same group
        }
      }],
      where: {
        weekNumber: week,
        isCorrect: {
          [Op.not]: null // Only include scored picks
        }
      },
      group: ['Pick.userId', 'user.id', 'user.username'],
      order: [[Pick.sequelize.literal('weeklyCorrect'), 'DESC']],
      raw: false
    });

    const formattedLeaderboard = weeklyLeaderboard.map(entry => ({
      userId: entry.userId,
      username: entry.user.username,
      totalCorrect: parseInt(entry.get('weeklyCorrect')) || 0, // Using totalCorrect for consistency with frontend
      weeklyCorrect: parseInt(entry.get('weeklyCorrect')) || 0,
      weeklyPicks: parseInt(entry.get('weeklyPicks')) || 0
    }));

    res.json(formattedLeaderboard);
  } catch (error) {
    console.error('Error fetching weekly leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's season stats
router.get('/user/:userId/stats', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Overall stats
    const overallStats = await Pick.findOne({
      attributes: [
        [Pick.sequelize.fn('COUNT', Pick.sequelize.col('id')), 'totalPicks'],
        [Pick.sequelize.fn('SUM', Pick.sequelize.literal('CASE WHEN is_correct = true THEN 1 ELSE 0 END')), 'totalCorrect']
      ],
      where: {
        userId,
        isCorrect: {
          [Op.not]: null
        }
      },
      raw: true
    });

    // Weekly breakdown
    const weeklyStats = await Pick.findAll({
      attributes: [
        'weekNumber',
        [Pick.sequelize.fn('COUNT', Pick.sequelize.col('id')), 'weeklyPicks'],
        [Pick.sequelize.fn('SUM', Pick.sequelize.literal('CASE WHEN is_correct = true THEN 1 ELSE 0 END')), 'weeklyCorrect']
      ],
      where: {
        userId,
        isCorrect: {
          [Op.not]: null
        }
      },
      group: ['weekNumber'],
      order: [['weekNumber', 'ASC']],
      raw: true
    });

    res.json({
      overall: {
        totalPicks: parseInt(overallStats.totalPicks) || 0,
        totalCorrect: parseInt(overallStats.totalCorrect) || 0,
        accuracy: overallStats.totalPicks > 0 
          ? Math.round((overallStats.totalCorrect / overallStats.totalPicks) * 100) 
          : 0
      },
      weekly: weeklyStats.map(week => ({
        week: week.weekNumber,
        picks: parseInt(week.weeklyPicks) || 0,
        correct: parseInt(week.weeklyCorrect) || 0,
        accuracy: week.weeklyPicks > 0 
          ? Math.round((week.weeklyCorrect / week.weeklyPicks) * 100) 
          : 0
      }))
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;