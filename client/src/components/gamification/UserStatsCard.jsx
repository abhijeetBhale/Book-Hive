import React from 'react';
import { Book, Users, Trophy, TrendingUp, Calendar, Star } from 'lucide-react';

const UserStatsCard = ({ userStats, className = '' }) => {
  if (!userStats) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const { reading, sharing, community, gamification, activity } = userStats;

  const stats = [
    {
      icon: Book,
      label: 'Books Read',
      value: reading?.booksRead || 0,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: Users,
      label: 'Books Shared',
      value: sharing?.booksLent || 0,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: Trophy,
      label: 'Achievements',
      value: gamification?.achievementsEarned || 0,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      icon: Star,
      label: 'Total Points',
      value: gamification?.totalPoints || 0,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const level = gamification?.currentLevel || 1;
  const experiencePoints = gamification?.experiencePoints || 0;
  const nextLevelXP = level * 100;
  const currentLevelXP = (level - 1) * 100;
  const progressToNextLevel = ((experiencePoints - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Your Stats</h3>
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-medium">
            Level {level}
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Level Progress</span>
          <span>{experiencePoints - currentLevelXP}/{nextLevelXP - currentLevelXP} XP</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progressToNextLevel, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-lg font-semibold text-gray-800">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Streaks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">Reading Streak</span>
          </div>
          <span className="text-lg font-bold text-orange-600">
            {reading?.readingStreak?.current || 0} days
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Login Streak</span>
          </div>
          <span className="text-lg font-bold text-green-600">
            {activity?.loginStreak?.current || 0} days
          </span>
        </div>
      </div>

      {/* Recent Badges */}
      {gamification?.badgesEarned?.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Badges</h4>
          <div className="flex flex-wrap gap-2">
            {gamification.badgesEarned.slice(-3).map((badge, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs font-medium"
              >
                {badge.badge}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStatsCard;