import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { leaderboardAPI, gamesAPI } from '../services/api';
import { LeaderboardEntry } from '../types';

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [view, setView] = useState<'overall' | 'weekly'>('overall');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [overallData, weekData] = await Promise.all([
        leaderboardAPI.getLeaderboard(),
        gamesAPI.getCurrentWeek(),
      ]);

      setLeaderboard(overallData);
      setCurrentWeek(weekData);

      const weeklyData = await leaderboardAPI.getWeeklyLeaderboard(weekData);
      setWeeklyLeaderboard(weeklyData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWeekChange = async (week: number) => {
    try {
      const weeklyData = await leaderboardAPI.getWeeklyLeaderboard(week);
      setWeeklyLeaderboard(weeklyData);
    } catch (error) {
      console.error('Error loading weekly leaderboard:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const currentData = view === 'overall' ? leaderboard : weeklyLeaderboard;

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
          <Link
            to="/dashboard"
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setView('overall')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              view === 'overall'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Overall Season
          </button>
          <button
            onClick={() => setView('weekly')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              view === 'weekly'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Weekly
          </button>
        </div>

        {view === 'weekly' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Week:
            </label>
            <select
              value={currentWeek}
              onChange={(e) => {
                const week = parseInt(e.target.value);
                setCurrentWeek(week);
                handleWeekChange(week);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              {Array.from({ length: 18 }, (_, i) => i + 1).map(week => (
                <option key={week} value={week}>
                  Week {week}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Correct Picks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {view === 'weekly' ? 'Week Performance' : 'Season Accuracy'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.map((entry, index) => {
                const isCurrentUser = false; // You'd check this against the current user
                const totalGames = view === 'weekly' ? 16 : (currentWeek * 16); // Approximate
                const accuracy = totalGames > 0 ? Math.round((entry.totalCorrect / totalGames) * 100) : 0;
                
                return (
                  <tr 
                    key={entry.userId}
                    className={`${isCurrentUser ? 'bg-primary-50' : ''} hover:bg-gray-50`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-lg font-bold ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-gray-400' :
                          index === 2 ? 'text-orange-600' :
                          'text-gray-600'
                        }`}>
                          #{index + 1}
                        </span>
                        {index < 3 && (
                          <span className="ml-2 text-lg">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.username}
                        {isCurrentUser && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-primary-600">
                        {entry.totalCorrect}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm text-gray-900">
                          {accuracy}%
                        </div>
                        <div className="ml-3 w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${Math.min(accuracy, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {currentData.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No data available for this period.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;