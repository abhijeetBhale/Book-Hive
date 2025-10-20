import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  RefreshCw, 
  BookOpen, 
  ArrowRight, 
  UserPlus, 
  Users, 
  Clock,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { adminAPIService } from '../../utils/adminAPI';

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchActivities();
    
    // Set up auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPIService.getDashboard();
      setActivities(response.data.data.recentActivity?.activities || []);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setError('Failed to load recent activity');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'book_added':
        return <BookOpen className="w-4 h-4" />;
      case 'borrow_request':
        return <ArrowRight className="w-4 h-4" />;
      case 'user_joined':
        return <UserPlus className="w-4 h-4" />;
      case 'club_created':
        return <Users className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (color) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-600';
      case 'green':
        return 'bg-green-100 text-green-600';
      case 'purple':
        return 'bg-purple-100 text-purple-600';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-600';
      case 'red':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case 'book_added':
        return 'bg-blue-100 text-blue-600';
      case 'borrow_request':
        return 'bg-purple-100 text-purple-600';
      case 'user_joined':
        return 'bg-green-100 text-green-600';
      case 'club_created':
        return 'bg-indigo-100 text-indigo-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return time.toLocaleDateString();
  };

  const displayActivities = showAll ? activities : activities.slice(0, 6);

  if (loading && activities.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <p className="text-sm text-gray-500">Real-time platform activity</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
          <button 
            onClick={fetchActivities}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {activities.length > 6 && (
            <button 
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>{showAll ? 'Show Less' : 'See All'}</span>
              <ChevronRight className={`w-3 h-3 transition-transform ${showAll ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="flex items-center justify-center h-32 bg-red-50 rounded-lg">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="text-red-600 text-sm">{error}</p>
            <button 
              onClick={fetchActivities}
              className="mt-2 px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      ) : activities.length === 0 ? (
        <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
          <div className="text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">No recent activity</p>
            <p className="text-sm text-gray-400">Activity will appear as users interact with the platform</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {displayActivities.map((activity, index) => (
            <div 
              key={index} 
              className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.color)}`}>
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBadgeColor(activity.type)}`}>
                      {activity.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500 truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-400 ml-2">
                    by {activity.user}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activity Summary */}
      {activities.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-sm font-semibold text-blue-600">
                {activities.filter(a => a.type === 'book_added').length}
              </div>
              <div className="text-xs text-gray-500">Books Added</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-purple-600">
                {activities.filter(a => a.type === 'borrow_request').length}
              </div>
              <div className="text-xs text-gray-500">Requests</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-green-600">
                {activities.filter(a => a.type === 'user_joined').length}
              </div>
              <div className="text-xs text-gray-500">New Users</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-indigo-600">
                {activities.filter(a => a.type === 'club_created').length}
              </div>
              <div className="text-xs text-gray-500">New Clubs</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;