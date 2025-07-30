require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

const sequelize = require('./src/config/database');
const { User, Game, Pick } = require('./src/models');

// Import routes
const authRoutes = require('./src/routes/auth');
const gameRoutes = require('./src/routes/games');
const pickRoutes = require('./src/routes/picks');
const leaderboardRoutes = require('./src/routes/leaderboard');
const adminRoutes = require('./src/routes/admin');

// Import services
const nflAPI = require('./src/services/nflAPI');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://yourdomain.com', // Replace with your actual domain
        /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/, // Allow any 192.168.x.x:3000
        'http://localhost:3000',
        'http://frontend:3000'
      ]
    : [
        'http://localhost:3000', 
        'http://frontend:3000',
        /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/, // Allow any 192.168.x.x:3000
        /^http:\/\/172\.\d{1,3}\.\d{1,3}\.\d{1,3}:3000$/ // Allow Docker network IPs
      ],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/picks', pickRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// Cron jobs for automated tasks
// Update scores every hour during game windows (Thursday 7 PM - Monday 11:59 PM CT)
cron.schedule('0 * * * *', async () => { // Every hour
  try {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 4 = Thursday
    const hour = now.getHours();

    // Check if we're in the game window
    const isGameWindow = (
      (day === 4 && hour >= 19) || // Thursday 7 PM onwards
      (day === 0) || // All Sunday
      (day === 1 && hour <= 23) // Monday until 11 PM
    );

    if (isGameWindow) {
      const currentWeek = nflAPI.getCurrentWeek();
      console.log(`Updating scores for week ${currentWeek}...`);
      
      // Update game scores from API
      const season = nflAPI.getCurrentSeason();
      const updatedGames = await nflAPI.updateGameScores(season, currentWeek);
      
      // Update database
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

      // Score picks for completed games
      const completedGames = await Game.findAll({
        where: {
          weekNumber: currentWeek,
          isCompleted: true
        }
      });

      for (const game of completedGames) {
        const winner = game.getWinner();
        if (winner) {
          await Pick.update(
            { isCorrect: sequelize.where(sequelize.col('selected_team'), winner) },
            {
              where: {
                gameId: game.id,
                isCorrect: null
              }
            }
          );
        }
      }

      console.log(`Score update complete. Updated ${updatedGames.length} games.`);
    }
  } catch (error) {
    console.error('Error in scheduled score update:', error);
  }
});

// Initialize database and start server
async function startServer() {
  const maxRetries = 10;
  const retryDelay = 5000; // 5 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Database connection attempt ${attempt}/${maxRetries}...`);
      
      // Test database connection
      await sequelize.authenticate();
      console.log('Database connection established successfully.');

      // Sync database models
      await sequelize.sync({ 
        force: process.env.NODE_ENV === 'development' && process.env.RESET_DB === 'true'
      });
      console.log('Database models synchronized.');

      // Start server
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`🏈 NFL Picks API server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`Health check available at: http://localhost:${PORT}/health`);
      });

      return; // Success, exit the retry loop

    } catch (error) {
      console.error(`Database connection attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('Max retries reached. Unable to start server.');
        process.exit(1);
      }
      
      console.log(`Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

startServer();