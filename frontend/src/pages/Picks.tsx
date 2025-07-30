import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gamesAPI, picksAPI } from '../services/api';
import { Game, Pick } from '../types';
import { format } from 'date-fns';

const Picks: React.FC = () => {
  const { week } = useParams<{ week: string }>();
  const navigate = useNavigate();
  const weekNumber = parseInt(week || '1');
  
  const [games, setGames] = useState<Game[]>([]);
  const [picks, setPicks] = useState<{ [gameId: string]: string }>({});
  const [existingPicks, setExistingPicks] = useState<Pick[]>([]);
  const [deadline, setDeadline] = useState<{ deadline: string; isOpen: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [weekNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      setLoading(true);
      const [gamesData, picksData, deadlineData] = await Promise.all([
        gamesAPI.getWeeklyGames(weekNumber),
        picksAPI.getUserPicks(weekNumber),
        picksAPI.getPicksDeadline(),
      ]);

      setGames(gamesData);
      setExistingPicks(picksData);
      setDeadline(deadlineData);

      // Pre-populate picks from existing data
      const picksMap: { [gameId: string]: string } = {};
      picksData.forEach(pick => {
        picksMap[pick.gameId] = pick.selectedTeam;
      });
      setPicks(picksMap);
    } catch (error) {
      console.error('Error loading picks data:', error);
      setMessage({ type: 'error', text: 'Failed to load games. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePickChange = (gameId: string, team: string) => {
    setPicks(prev => ({
      ...prev,
      [gameId]: team
    }));
  };

  const handleSubmit = async () => {
    if (!deadline?.isOpen) {
      setMessage({ type: 'error', text: 'Picks are no longer being accepted.' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const picksToSubmit = Object.entries(picks).map(([gameId, selectedTeam]) => ({
        weekNumber,
        gameId,
        selectedTeam,
      }));

      await picksAPI.submitPicks(picksToSubmit);
      setMessage({ type: 'success', text: 'Picks saved successfully!' });
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save picks. Please try again.' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!deadline?.isOpen) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Picks for Week {weekNumber}
          </h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-medium">Picks are no longer being accepted</p>
            <p className="text-sm">
              Deadline was: {deadline && format(new Date(deadline.deadline), 'EEEE, MMMM do \'at\' h:mm a')}
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalPicks = Object.keys(picks).length;
  const totalGames = games.length;

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Make Picks for Week {weekNumber}
          </h1>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Deadline: {format(new Date(deadline.deadline), 'EEE, MMM d \'at\' h:mm a')}
            </p>
            <p className="text-lg font-semibold text-primary-600">
              {totalPicks} / {totalGames} games picked
            </p>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-md mb-6 ${
            message.type === 'success' 
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          {games.map(game => {
            const isCompleted = game.isCompleted;
            const userPick = picks[game.id];
            
            return (
              <div 
                key={game.id} 
                className={`border rounded-lg p-4 ${isCompleted ? 'bg-gray-50' : 'bg-white'}`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-lg font-semibold">
                      {game.awayTeam} @ {game.homeTeam}
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(game.gameTime), 'EEE, MMM d \'at\' h:mm a')}
                    </p>
                  </div>
                  {isCompleted && (
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {game.awayTeam} {game.awayScore} - {game.homeScore} {game.homeTeam}
                      </p>
                      <p className="text-sm text-gray-600">Final</p>
                    </div>
                  )}
                </div>

                {!isCompleted && (
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handlePickChange(game.id, game.awayTeam)}
                      className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                        userPick === game.awayTeam
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {game.awayTeam}
                    </button>
                    <button
                      onClick={() => handlePickChange(game.id, game.homeTeam)}
                      className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                        userPick === game.homeTeam
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {game.homeTeam}
                    </button>
                  </div>
                )}

                {isCompleted && userPick && (
                  <div className="mt-3">
                    <p className="text-sm">
                      Your pick: <span className="font-medium">{userPick}</span>
                      {existingPicks.find(p => p.gameId === game.id)?.isCorrect !== undefined && (
                        <span className={`ml-2 ${
                          existingPicks.find(p => p.gameId === game.id)?.isCorrect 
                            ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {existingPicks.find(p => p.gameId === game.id)?.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            Back to Dashboard
          </button>
          
          {totalPicks < totalGames && (
            <p className="text-orange-600 font-medium">
              Warning: You haven't picked all games yet!
            </p>
          )}
          
          <button
            onClick={handleSubmit}
            disabled={saving || totalPicks === 0}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Picks'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Picks;