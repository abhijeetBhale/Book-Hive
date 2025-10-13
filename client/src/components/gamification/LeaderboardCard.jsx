import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Star, Book, Users } from 'lucide-react';
import { achievementsAPI } from '../../utils/gamificationAPI';

const LeaderboardCard = ({ className = '' }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState('totalPoints');

  const metrics = [
    { value: 'totalPoints', label: 'Total Points', icon: Star },
    { value: 'booksRead', label: 'Books Read', icon: Book },
    { value: 'booksLent', label: 'Books Shared', icon: Users },
    { value: 'achievementsEarned', label: 'Achievements', icon: Trophy }
  ];

  useEffect(() => {
    fetchLeaderboard();
  }, [metric]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await achievementsAPI.getLeaderboard({ metric, limit: 10 });
      setLeaderboard(response.data.data.leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankBg = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-100 to-gray-50 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-amber-100 to-amber-50 border-amber-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                <div className="w-12 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
          Leaderboard
        </h3>
      </div>

      {/* Metric Selector */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.value}
                onClick={() => setMetric(m.value)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  metric === m.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No leaderboard data available</p>
          </div>
        ) : (
          leaderboard.map((entry, index) => (
            <div
              key={entry.user._id}
              className={`flex items-center space-x-4 p-3 rounded-lg border transition-all hover:shadow-sm ${getRankBg(entry.rank)}`}
            >
              {/* Rank */}
              <div className="flex-shrink-0">
                {getRankIcon(entry.rank)}
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {entry.user.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {entry.user.name || 'Anonymous User'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Level {entry.level}
                  </p>
                </div>
              </div>

              {/* Score */}
              <div className="flex-shrink-0 text-right">
                <p className="font-bold text-gray-800">
                  {entry.value.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {metrics.find(m => m.value === metric)?.label}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {leaderboard.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Updated in real-time • Top 10 users shown
          </p>
        </div>
      )}
    </div>
  );
};

export default LeaderboardCard;