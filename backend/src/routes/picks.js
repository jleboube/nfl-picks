const express = require('express');
const { Pick, Game, User } = require('../models');
const auth = require('../middleware/auth');
const nflAPI = require('../services/nflAPI');

const router = express.Router();

// Get user's picks for a specific week
router.get('/week/:week', auth, async (req, res) => {
  try {
    const week = parseInt(req.params.week);
    
    if (week < 1 || week > 18) {
      return res.status(400).json({ message: 'Invalid week number' });
    }

    const picks = await Pick.findAll({
      where: {
        userId: req.user.id,
        weekNumber: week
      },
      include: [{
        model: Game,
        as: 'game'
      }],
      order: [['game', 'gameTime', 'ASC']]
    });

    res.json(picks);
  } catch (error) {
    console.error('Error fetching picks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit picks for multiple games
router.post('/', auth, async (req, res) => {
  try {
    const { picks } = req.body;
    
    if (!picks || !Array.isArray(picks) || picks.length === 0) {
      return res.status(400).json({ message: 'Invalid picks data' });
    }

    // Check if picks are still open
    const firstPick = picks[0];
    const deadline = nflAPI.getPicksDeadline(firstPick.weekNumber);
    
    if (!deadline.isOpen) {
      return res.status(400).json({ message: 'Picks deadline has passed' });
    }

    // Validate all games exist and belong to the specified week
    const gameIds = picks.map(pick => pick.gameId);
    const games = await Game.findAll({
      where: {
        id: gameIds,
        weekNumber: firstPick.weekNumber
      }
    });

    if (games.length !== picks.length) {
      return res.status(400).json({ message: 'One or more invalid games' });
    }

    // Prepare picks data
    const picksData = picks.map(pick => ({
      userId: req.user.id,
      weekNumber: pick.weekNumber,
      gameId: pick.gameId,
      selectedTeam: pick.selectedTeam
    }));

    // Delete existing picks for this user and week, then insert new ones
    await Pick.destroy({
      where: {
        userId: req.user.id,
        weekNumber: firstPick.weekNumber
      }
    });

    const createdPicks = await Pick.bulkCreate(picksData);

    res.json({
      message: 'Picks submitted successfully',
      picks: createdPicks
    });
  } catch (error) {
    console.error('Error submitting picks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get picks deadline information
router.get('/deadline', auth, async (req, res) => {
  try {
    const currentWeek = nflAPI.getCurrentWeek();
    const deadline = nflAPI.getPicksDeadline(currentWeek);
    
    res.json(deadline);
  } catch (error) {
    console.error('Error getting deadline:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Score picks for a specific week (could be triggered by cron job)
router.post('/score/:week', auth, async (req, res) => {
  try {
    const week = parseInt(req.params.week);
    
    // Get all completed games for the week
    const completedGames = await Game.findAll({
      where: {
        weekNumber: week,
        isCompleted: true
      }
    });

    if (completedGames.length === 0) {
      return res.json({ message: 'No completed games to score' });
    }

    let scoredPicks = 0;

    for (const game of completedGames) {
      const winner = game.getWinner();
      if (!winner) continue;

      // Update all picks for this game
      const [updatedCount] = await Pick.update(
        { isCorrect: Pick.sequelize.col('selected_team') === winner },
        {
          where: {
            gameId: game.id,
            isCorrect: null // Only update unscored picks
          }
        }
      );

      scoredPicks += updatedCount;
    }

    res.json({
      message: `Scored ${scoredPicks} picks for ${completedGames.length} completed games`
    });
  } catch (error) {
    console.error('Error scoring picks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;