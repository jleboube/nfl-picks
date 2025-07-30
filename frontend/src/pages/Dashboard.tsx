import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gamesAPI, picksAPI, leaderboardAPI } from '../services/api';
import { Game, Pick, LeaderboardEntry } from '../types';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [games, setGames] = useState<Game[]>([]);
  const [userPicks, setUserPicks] = useState<Pick[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [deadline, setDeadline] = useState<{ deadline: string; isOpen: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [weekData, deadlineData, leaderboardData] = await Promise.all([
        gamesAPI.getCurrentWeek(),
        picksAPI.getPicksDeadline(),
        leaderboardAPI.getLeaderboard(),
      ]);

      setCurrentWeek(weekData);
      setDeadline(deadlineData);
      setLeaderboard(leaderboardData);

      const [gamesData, picksData] = await Promise.all([
        gamesAPI.getWeeklyGames(weekData),
        picksAPI.getUserPicks(weekData),
      ]);

      setGames(gamesData);
      setUserPicks(picksData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const completedGames = games.filter(game => game.isCompleted);
  const upcomingGames = games.filter(game => !game.isCompleted);
  const correctPicks = userPicks.filter(pick => pick.isCorrect === true).length;
  const totalPicks = userPicks.length;

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Week {currentWeek} Dashboard
        </h1>
        
        {deadline && (
          <div className={`p-4 rounded-md mb-4 ${
            deadline.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <p className="font-medium">
              Picks {deadline.isOpen ? 'are open' : 'are closed'}
            </p>
            <p className="text-sm">
              Deadline: {format(new Date(deadline.deadline), 'EEEE, MMMM do \'at\' h:mm a')}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-primary-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-primary-700">Your Picks</h3>
            <p className="text-2xl font-bold text-primary-900">
              {correctPicks} / {totalPicks}
            </p>
            <p className="text-sm text-primary-600">
              {totalPicks > 0 ? `${Math.round((correctPicks / totalPicks) * 100)}% accuracy` : 'No picks yet'}
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-700">Games Completed</h3>
            <p className="text-2xl font-bold text-blue-900">
              {completedGames.length} / {games.length}
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-700">Your Rank</h3>
            <p className="text-2xl font-bold text-green-900">
              #{leaderboard.findIndex(entry => entry.userId === userPicks[0]?.userId) + 1 || '-'}
            </p>
          </div>
        </div>

        <div className="flex space-x-4">
          {deadline?.isOpen && (
            <Link
              to={`/picks/${currentWeek}`}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Make Picks for Week {currentWeek}
            </Link>
          )}
          
          <Link
            to="/leaderboard"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            View Leaderboard
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {upcomingGames.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Games</h2>
            <div className="space-y-3">
              {upcomingGames.slice(0, 5).map(game => (
                <div key={game.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{game.awayTeam} @ {game.homeTeam}</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(game.gameTime), 'EEE, MMM d \'at\' h:mm a')}
                    </p>
                  </div>
                  <div className="text-sm">
                    {userPicks.find(pick => pick.gameId === game.id) ? (
                      <span className="text-green-600 font-medium">✓ Picked</span>
                    ) : (
                      <span className="text-gray-400">No pick</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Performers</h2>
          <div className="space-y-3">
            {leaderboard.slice(0, 5).map((entry, index) => (
              <div key={entry.userId} className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-lg font-bold text-gray-400 w-8">
                    #{index + 1}
                  </span>
                  <span className="font-medium">{entry.username}</span>
                </div>
                <span className="text-lg font-bold text-primary-600">
                  {entry.totalCorrect}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;