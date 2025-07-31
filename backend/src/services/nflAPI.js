const axios = require('axios');

class NFLAPIService {
  constructor() {
    this.apiKey = process.env.NFL_API_KEY;
    this.baseURL = 'https://api.sportsdata.io/v3/nfl';
  }

  async getWeeklySchedule(season, week) {
    try {
      if (!this.apiKey) {
        // Return mock data if no API key is provided
        return this.getMockWeeklySchedule(week);
      }

      const response = await axios.get(
        `${this.baseURL}/scores/json/ScoresByWeek/${season}/${week}`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey
          }
        }
      );

      return response.data.map(game => ({
        externalId: game.GameKey,
        weekNumber: week,
        homeTeam: game.HomeTeam,
        awayTeam: game.AwayTeam,
        gameTime: new Date(game.DateTime),
        homeScore: game.HomeScore,
        awayScore: game.AwayScore,
        isCompleted: game.IsFinal || false
      }));
    } catch (error) {
      console.error('Error fetching NFL schedule:', error);
      // Fallback to mock data
      return this.getMockWeeklySchedule(week);
    }
  }

  getMockWeeklySchedule(week) {
    const teams = [
      'Buffalo Bills', 'Miami Dolphins', 'New England Patriots', 'New York Jets',
      'Baltimore Ravens', 'Cincinnati Bengals', 'Cleveland Browns', 'Pittsburgh Steelers',
      'Houston Texans', 'Indianapolis Colts', 'Jacksonville Jaguars', 'Tennessee Titans',
      'Denver Broncos', 'Kansas City Chiefs', 'Las Vegas Raiders', 'Los Angeles Chargers',
      'Dallas Cowboys', 'New York Giants', 'Philadelphia Eagles', 'Washington Commanders',
      'Chicago Bears', 'Detroit Lions', 'Green Bay Packers', 'Minnesota Vikings',
      'Atlanta Falcons', 'Carolina Panthers', 'New Orleans Saints', 'Tampa Bay Buccaneers',
      'Arizona Cardinals', 'Los Angeles Rams', 'San Francisco 49ers', 'Seattle Seahawks'
    ];

    const games = [];
    const startDate = new Date(2025, 8, 8 + (week - 1) * 7); // Start from Sept 8, 2025

    // Generate 16 games for the week
    for (let i = 0; i < 16; i++) {
      const gameDate = new Date(startDate);
      
      // Spread games across Thursday, Sunday, and Monday
      if (i === 0) {
        gameDate.setDate(startDate.getDate() + 3); // Thursday
        gameDate.setHours(20, 0, 0, 0); // 8 PM
      } else if (i <= 13) {
        gameDate.setDate(startDate.getDate() + 6); // Sunday
        gameDate.setHours(13 + (i % 2) * 3, 0, 0, 0); // 1 PM or 4 PM
      } else {
        gameDate.setDate(startDate.getDate() + 7); // Monday
        gameDate.setHours(20, 0, 0, 0); // 8 PM
      }

      const homeTeamIndex = (i * 2) % teams.length;
      const awayTeamIndex = (i * 2 + 1) % teams.length;

      games.push({
        externalId: `2025-W${week}-${i + 1}`,
        weekNumber: week,
        homeTeam: teams[homeTeamIndex],
        awayTeam: teams[awayTeamIndex],
        gameTime: gameDate,
        homeScore: null,
        awayScore: null,
        isCompleted: false
      });
    }

    return games;
  }

  async updateGameScores(season, week) {
    try {
      const games = await this.getWeeklySchedule(season, week);
      return games.filter(game => game.isCompleted);
    } catch (error) {
      console.error('Error updating game scores:', error);
      return [];
    }
  }

  getCurrentSeason() {
    const now = new Date();
    const year = now.getFullYear();
    // NFL season typically starts in September
    return now.getMonth() >= 8 ? year : year - 1;
  }

  getCurrentWeek() {
    const now = new Date();
    const seasonStart = new Date(2025, 8, 8); // September 8, 2025
    
    if (now < seasonStart) {
      return 1;
    }

    const weeksDiff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
    return Math.min(Math.max(weeksDiff + 1, 1), 18);
  }

  async getFullSeasonSchedule(season) {
    try {
      const allGames = [];
      
      // Fetch all 18 weeks of regular season
      for (let week = 1; week <= 18; week++) {
        console.log(`Fetching schedule for week ${week}...`);
        const weekGames = await this.getWeeklySchedule(season, week);
        allGames.push(...weekGames);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return allGames;
    } catch (error) {
      console.error('Error fetching full season schedule:', error);
      return [];
    }
  }

  async getTeamRecord(teamName, throughWeek, season) {
    try {
      if (!this.apiKey) {
        // Return mock record if no API key
        return { wins: Math.floor(Math.random() * throughWeek), losses: Math.floor(Math.random() * throughWeek) };
      }

      const response = await axios.get(
        `${this.baseURL}/scores/json/TeamSeasonStats/${season}`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey
          }
        }
      );

      const teamStats = response.data.find(team => 
        team.Team === teamName || team.Name === teamName
      );

      if (teamStats) {
        return {
          wins: teamStats.Wins || 0,
          losses: teamStats.Losses || 0,
          ties: teamStats.Ties || 0
        };
      }

      return { wins: 0, losses: 0, ties: 0 };
    } catch (error) {
      console.error(`Error fetching team record for ${teamName}:`, error);
      // Return mock data as fallback
      return { wins: Math.floor(Math.random() * throughWeek), losses: Math.floor(Math.random() * throughWeek) };
    }
  }

  getPicksDeadline(week) {
    const seasonStart = new Date(2025, 8, 8); // September 8, 2025
    const weekStart = new Date(seasonStart);
    weekStart.setDate(seasonStart.getDate() + (week - 1) * 7);
    
    // Deadline is Thursday 12:00 PM CT of each week
    const deadline = new Date(weekStart);
    deadline.setDate(weekStart.getDate() + 3); // Thursday
    deadline.setHours(12, 0, 0, 0); // 12:00 PM
    
    const now = new Date();
    return {
      deadline: deadline.toISOString(),
      isOpen: now < deadline
    };
  }
}

module.exports = new NFLAPIService();