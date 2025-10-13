import React from 'react';
import { Trophy, Lock, Star } from 'lucide-react';

const AchievementCard = ({ achievement, userProgress, isLocked = false }) => {
  const isCompleted = userProgress?.isCompleted || false;
  const progress = userProgress?.progress || { current: 0, target: achievement.criteria?.target || 1, percentage: 0 };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'uncommon': return 'text-green-600 bg-green-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRarityBorder = (rarity) => {
    switch (rarity) {
      case 'common': return 'border-gray-300';
      case 'uncommon': return 'border-green-300';
      case 'rare': return 'border-blue-300';
      case 'epic': return 'border-purple-300';
      case 'legendary': return 'border-yellow-300';
      default: return 'border-gray-300';
    }
  };

  return (
    <div className={`relative p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
      isCompleted ? `${getRarityBorder(achievement.rarity)} bg-gradient-to-br from-white to-gray-50` : 
      isLocked ? 'border-gray-200 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      {/* Rarity Badge */}
      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(achievement.rarity)}`}>
        {achievement.rarity}
      </div>

      {/* Achievement Icon */}
      <div className="flex items-center mb-3">
        <div className={`text-3xl mr-3 ${isLocked ? 'grayscale opacity-50' : ''}`}>
          {isLocked ? <Lock className="w-8 h-8 text-gray-400" /> : achievement.icon}
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold text-lg ${isLocked ? 'text-gray-400' : 'text-gray-800'}`}>
            {isLocked ? '???' : achievement.name}
          </h3>
          <p className={`text-sm ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
            {isLocked ? 'Hidden Achievement' : achievement.description}
          </p>
        </div>
        {isCompleted && (
          <Trophy className="w-6 h-6 text-yellow-500 ml-2" />
        )}
      </div>

      {/* Progress Bar */}
      {!isLocked && !isCompleted && progress.target > 1 && (
        <div className="mb-3">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{progress.current}/{progress.target}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress.percentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Rewards */}
      {!isLocked && achievement.rewards && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-3">
            {achievement.rewards.points > 0 && (
              <span className="flex items-center text-blue-600">
                <Star className="w-4 h-4 mr-1" />
                {achievement.rewards.points} pts
              </span>
            )}
            {achievement.rewards.badge && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                {achievement.rewards.badge}
              </span>
            )}
          </div>
          {isCompleted && userProgress?.completedAt && (
            <span className="text-xs text-gray-500">
              Earned {new Date(userProgress.completedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* Completion Overlay */}
      {isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-lg pointer-events-none" />
      )}
    </div>
  );
};

export default AchievementCard;