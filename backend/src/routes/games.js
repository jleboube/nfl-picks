const express = require('express');
const { Game } = require('../models');
const auth = require('../middleware/auth');
const nflAPI = require('../services/nflAPI');

const router = express.Router();

// Get games for a specific week
router.get('/week/:week', auth, async (req, res) => {
  try {
    const week = parseInt(req.params.week);
    
    if (week < 1 || week > 18) {
      return res.status(400).json({ message: 'Invalid week number' });
    }

    let games = await Game.findAll({
      where: { weekNumber: week },
      order: [['gameTime', 'ASC']]
    });

    // If no games found in database, fetch from API and save
    if (games.length === 0) {
      const season = nflAPI.getCurrentSeason();
      const apiGames = await nflAPI.getWeeklySchedule(season, week);
      
      games = await Game.bulkCreate(apiGames, {
        ignoreDuplicates: true,
        returning: true
      });
    }

    res.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current week number
router.get('/current-week', auth, async (req, res) => {
  try {
    const currentWeek = nflAPI.getCurrentWeek();
    res.json({ week: currentWeek });
  } catch (error) {
    console.error('Error getting current week:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update game scores (admin endpoint - could be protected further)
router.post('/update-scores/:week', auth, async (req, res) => {
  try {
    const week = parseInt(req.params.week);
    const season = nflAPI.getCurrentSeason();
    
    const updatedGames = await nflAPI.updateGameScores(season, week);
    
    for (const gameData of updatedGames) {
      await Game.update(
        {
          homeScore: gameData.homeScore,
          awayScore: gameData.awayScore,
          isCompleted: gameData.isCompleted
        },
        {
          where: { externalId: gameData.externalId }
        }
      );
    }

    res.json({ message: `Updated ${updatedGames.length} games for week ${week}` });
  } catch (error) {
    console.error('Error updating scores:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;