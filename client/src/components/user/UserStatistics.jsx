import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Calendar, 
  Leaf, 
  DollarSign,
  Award,
  Target,
  BarChart3,
  Heart
} from 'lucide-react';
import { usersAPI } from '../../utils/api';

const UserStatistics = ({ userId, showTitle = true }) => {
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatistics();
  }, [userId]);

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await usersAPI.getUserStatistics();
      setStatistics(data.statistics);
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      setError('Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center text-red-600">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{error}</p>
          <button 
            onClick={fetchStatistics}
            className="mt-2 text-blue-600 hover:text-blue-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue', trend }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-${color}-100`}>
            <Icon className={`w-5 h-5 text-${color}-600`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>
        {trend && (
          <div className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className="w-4 h-4 inline mr-1" />
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Your BookHive Impact</h2>
        </div>
      )}

      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={BookOpen}
          title="Books Owned"
          value={statistics.booksOwned}
          subtitle="In your library"
          color="blue"
        />
        
        <StatCard
          icon={Users}
          title="Books Shared"
          value={statistics.booksShared}
          subtitle="Currently borrowed"
          color="green"
        />
        
        <StatCard
          icon={Heart}
          title="Books Received"
          value={statistics.booksReceived}
          subtitle="Successfully borrowed"
          color="purple"
        />
        
        <StatCard
          icon={Target}
          title="Borrow Success Rate"
          value={`${statistics.borrowSuccessRate}%`}
          subtitle={`${statistics.successfulBorrows}/${statistics.totalBorrowRequests} requests`}
          color="orange"
        />
        
        <StatCard
          icon={Award}
          title="Lend Success Rate"
          value={`${statistics.lendSuccessRate}%`}
          subtitle={`${statistics.successfulLends} successful lends`}
          color="indigo"
        />
        
        <StatCard
          icon={Calendar}
          title="Member Since"
          value={statistics.daysSinceMember}
          subtitle={`days (${new Date(statistics.memberSince).toLocaleDateString()})`}
          color="gray"
        />
      </div>

      {/* Community Impact Section */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
        <div className="flex items-center gap-3 mb-4">
          <Leaf className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Environmental Impact</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {statistics.communityImpact.carbonFootprintSaved} kg
            </div>
            <div className="text-sm text-gray-600">CO₂ Saved</div>
            <div className="text-xs text-gray-500 mt-1">
              By borrowing instead of buying new books
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              ${statistics.communityImpact.moneySaved}
            </div>
            <div className="text-sm text-gray-600">Money Saved</div>
            <div className="text-xs text-gray-500 mt-1">
              Estimated savings from borrowing
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {statistics.communityImpact.booksKeptInCirculation}
            </div>
            <div className="text-sm text-gray-600">Books in Circulation</div>
            <div className="text-xs text-gray-500 mt-1">
              Books kept active in the community
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Badges */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* First Book Badge */}
          <div className={`text-center p-3 rounded-lg border-2 ${
            statistics.booksOwned > 0 
              ? 'border-yellow-300 bg-yellow-50' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <BookOpen className={`w-8 h-8 mx-auto mb-2 ${
              statistics.booksOwned > 0 ? 'text-yellow-600' : 'text-gray-400'
            }`} />
            <div className="text-sm font-medium">First Book</div>
            <div className="text-xs text-gray-500">Add your first book</div>
          </div>

          {/* Sharing Star Badge */}
          <div className={`text-center p-3 rounded-lg border-2 ${
            statistics.booksShared > 0 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <Users className={`w-8 h-8 mx-auto mb-2 ${
              statistics.booksShared > 0 ? 'text-green-600' : 'text-gray-400'
            }`} />
            <div className="text-sm font-medium">Sharing Star</div>
            <div className="text-xs text-gray-500">Share your first book</div>
          </div>

          {/* Community Helper Badge */}
          <div className={`text-center p-3 rounded-lg border-2 ${
            statistics.successfulBorrows >= 5 
              ? 'border-blue-300 bg-blue-50' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <Heart className={`w-8 h-8 mx-auto mb-2 ${
              statistics.successfulBorrows >= 5 ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <div className="text-sm font-medium">Community Helper</div>
            <div className="text-xs text-gray-500">Borrow 5 books</div>
          </div>

          {/* Eco Warrior Badge */}
          <div className={`text-center p-3 rounded-lg border-2 ${
            statistics.communityImpact.carbonFootprintSaved >= 10 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <Leaf className={`w-8 h-8 mx-auto mb-2 ${
              statistics.communityImpact.carbonFootprintSaved >= 10 ? 'text-green-600' : 'text-gray-400'
            }`} />
            <div className="text-sm font-medium">Eco Warrior</div>
            <div className="text-xs text-gray-500">Save 10kg CO₂</div>
          </div>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            You've been making a positive impact on the BookHive community for{' '}
            <span className="font-semibold text-blue-600">{statistics.daysSinceMember} days</span>!
            {statistics.communityImpact.booksKeptInCirculation > 0 && (
              <span>
                {' '}Your sharing has kept{' '}
                <span className="font-semibold text-green-600">
                  {statistics.communityImpact.booksKeptInCirculation} books
                </span>{' '}
                in active circulation.
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserStatistics;