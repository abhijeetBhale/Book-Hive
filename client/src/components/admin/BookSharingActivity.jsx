import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { adminAPIService } from '../../utils/adminAPI';

const BookSharingActivity = () => {
  const [activeTab, setActiveTab] = useState('monthly');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tabs = [
    { id: 'monthly', label: 'Monthly', period: 'Last 12 Months' },
    { id: 'quarterly', label: 'Quarterly', period: 'Last 8 Quarters' },
    { id: 'yearly', label: 'Yearly', period: 'Last 5 Years' }
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPIService.getBookSharingActivity(activeTab);
      setData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching book sharing activity:', error);
      setError('Failed to load activity data');
    } finally {
      setLoading(false);
    }
  };

  const getMaxValue = () => {
    if (!data.length) return 100;
    return Math.max(...data.map(item => 
      Math.max(item.totalRequests || 0, item.newBooks || 0)
    ));
  };

  const formatPeriod = (period) => {
    if (activeTab === 'monthly') {
      const [year, month] = period.split('-');
      const date = new Date(year, month - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
    return period;
  };

  const calculateGrowth = () => {
    if (data.length < 2) return 0;
    const current = data[data.length - 1]?.totalRequests || 0;
    const previous = data[data.length - 2]?.totalRequests || 0;
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const totalActivity = data.reduce((sum, item) => sum + (item.totalRequests || 0), 0);
  const totalBooks = data.reduce((sum, item) => sum + (item.newBooks || 0), 0);
  const growth = calculateGrowth();

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Book Sharing Activity</h3>
          <p className="text-sm text-gray-500">Track borrowing trends and new book additions</p>
        </div>
        <button 
          onClick={fetchData}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex items-center space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{totalActivity}</div>
          <div className="text-xs text-blue-600">Total Requests</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{totalBooks}</div>
          <div className="text-xs text-purple-600">New Books</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className={`text-2xl font-bold ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {growth >= 0 ? '+' : ''}{growth}%
          </div>
          <div className={`text-xs ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>Growth</div>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">Loading activity data...</p>
          </div>
        </div>
      ) : error ? (
        <div className="h-64 bg-red-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-2 px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">No activity data available</p>
            <p className="text-sm text-gray-400">Data will appear as users start sharing books</p>
          </div>
        </div>
      ) : (
        <div className="h-64 relative">
          <div className="flex items-end justify-between h-full space-x-2 px-2">
            {data.slice(-12).map((item, index) => {
              const maxValue = getMaxValue();
              const borrowHeight = ((item.totalRequests || 0) / maxValue) * 100;
              const bookHeight = ((item.newBooks || 0) / maxValue) * 100;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex items-end justify-center space-x-1 mb-2" style={{ height: '200px' }}>
                    {/* Borrow Requests Bar */}
                    <div 
                      className="bg-blue-500 rounded-t min-w-[8px] flex-1 max-w-[20px] relative group"
                      style={{ height: `${borrowHeight}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.totalRequests || 0} requests
                      </div>
                    </div>
                    
                    {/* New Books Bar */}
                    <div 
                      className="bg-purple-500 rounded-t min-w-[8px] flex-1 max-w-[20px] relative group"
                      style={{ height: `${bookHeight}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.newBooks || 0} books
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 text-center transform -rotate-45 origin-center w-16">
                    {formatPeriod(item.period)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Borrow Requests</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span className="text-sm text-gray-600">New Books</span>
        </div>
      </div>
    </div>
  );
};

export default BookSharingActivity;