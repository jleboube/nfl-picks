const express = require('express');
const { Group, GroupCode, User, Game } = require('../models');
const auth = require('../middleware/auth');
const nflAPI = require('../services/nflAPI');

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

// Populate the entire NFL schedule for a season
router.post('/populate-schedule/:season', async (req, res) => {
  try {
    const season = parseInt(req.params.season);
    
    if (!season || season < 2020 || season > 2030) {
      return res.status(400).json({ message: 'Invalid season year' });
    }

    console.log(`Starting to populate schedule for ${season} season...`);
    
    // Fetch full season schedule
    const allGames = await nflAPI.getFullSeasonSchedule(season);
    
    if (allGames.length === 0) {
      return res.status(404).json({ message: 'No games found for this season' });
    }

    // Bulk insert games, ignoring duplicates
    const createdGames = await Game.bulkCreate(allGames, {
      ignoreDuplicates: true,
      returning: true
    });

    res.status(201).json({
      message: `Successfully populated ${createdGames.length} games for ${season} season`,
      gamesPopulated: createdGames.length,
      totalWeeks: 18
    });
  } catch (error) {
    console.error('Error populating schedule:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get team records for a specific week (useful for displaying current standings)
router.get('/team-records/:season/:week?', async (req, res) => {
  try {
    const season = parseInt(req.params.season);
    const throughWeek = req.params.week ? parseInt(req.params.week) : nflAPI.getCurrentWeek();
    
    if (!season || season < 2020 || season > 2030) {
      return res.status(400).json({ message: 'Invalid season year' });
    }

    // Get list of all NFL teams from games in the database
    const teams = await Game.findAll({
      attributes: ['homeTeam'],
      group: ['homeTeam'],
      raw: true
    });

    const teamRecords = [];
    
    for (const team of teams) {
      const record = await nflAPI.getTeamRecord(team.homeTeam, throughWeek, season);
      teamRecords.push({
        team: team.homeTeam,
        wins: record.wins,
        losses: record.losses,
        ties: record.ties || 0,
        record: `${record.wins}-${record.losses}${record.ties ? `-${record.ties}` : ''}`
      });
    }

    // Sort by wins descending
    teamRecords.sort((a, b) => b.wins - a.wins);

    res.json({
      season,
      throughWeek,
      teams: teamRecords
    });
  } catch (error) {
    console.error('Error fetching team records:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get schedule overview - how many games are populated per week
router.get('/schedule-overview/:season?', async (req, res) => {
  try {
    const season = req.params.season ? parseInt(req.params.season) : nflAPI.getCurrentSeason();
    
    const weeklyGameCounts = [];
    
    for (let week = 1; week <= 18; week++) {
      const gameCount = await Game.count({
        where: { weekNumber: week }
      });
      
      weeklyGameCounts.push({
        week,
        gamesScheduled: gameCount,
        isPopulated: gameCount > 0
      });
    }

    const totalGames = await Game.count();
    
    res.json({
      season,
      totalGames,
      weeks: weeklyGameCounts,
      isFullyPopulated: weeklyGameCounts.every(w => w.isPopulated)
    });
  } catch (error) {
    console.error('Error fetching schedule overview:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;