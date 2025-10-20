import React, { useState, useEffect } from 'react';
import { PieChart, Eye, RefreshCw, ChevronRight, BookOpen } from 'lucide-react';
import { adminAPIService } from '../../utils/adminAPI';

const TopCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPIService.getTopCategories();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    'bg-blue-500',
    'bg-purple-500', 
    'bg-green-500',
    'bg-orange-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-pink-500',
    'bg-yellow-500',
    'bg-teal-500',
    'bg-gray-500'
  ];

  const strokeColors = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#10b981', // green
    '#f59e0b', // orange
    '#ef4444', // red
    '#6366f1', // indigo
    '#ec4899', // pink
    '#eab308', // yellow
    '#14b8a6', // teal
    '#6b7280'  // gray
  ];

  const displayCategories = showAll ? categories : categories.slice(0, 4);
  const totalBooks = categories.reduce((sum, cat) => sum + cat.count, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Top Categories</h3>
          <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">Loading categories...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Top Categories</h3>
          <button onClick={fetchCategories} className="p-1 hover:bg-gray-100 rounded">
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg">
          <div className="text-center">
            <PieChart className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchCategories}
              className="mt-2 px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Top Categories</h3>
          <button onClick={fetchCategories} className="p-1 hover:bg-gray-100 rounded">
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">No categories available</p>
            <p className="text-sm text-gray-400">Categories will appear when books are added</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Top Categories</h3>
          <p className="text-sm text-gray-500">Book distribution by category</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={fetchCategories}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>{showAll ? 'Show Less' : 'See All'}</span>
            <ChevronRight className={`w-3 h-3 transition-transform ${showAll ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* Donut Chart Visualization */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-44 h-44">
          {/* SVG Donut Chart */}
          <svg className="w-44 h-44" viewBox="0 0 160 160">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r="60"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="16"
            />
            
            {/* Category segments */}
            {(() => {
              let cumulativePercentage = 0;
              return categories.slice(0, 5).map((category, index) => {
                const percentage = totalBooks > 0 ? (category.count / totalBooks) : 0;
                const circumference = 2 * Math.PI * 60;
                const strokeLength = circumference * percentage;
                const strokeDasharray = `${strokeLength} ${circumference}`;
                const rotation = cumulativePercentage * 360 - 90; // Start from top
                
                cumulativePercentage += percentage;
                
                return (
                  <circle
                    key={category.name}
                    cx="80"
                    cy="80"
                    r="60"
                    fill="none"
                    stroke={strokeColors[index] || '#6b7280'}
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray={strokeDasharray}
                    style={{
                      transformOrigin: '80px 80px',
                      transform: `rotate(${rotation}deg)`,
                      transition: 'all 0.6s ease-in-out'
                    }}
                    className="hover:opacity-80 cursor-pointer"
                  />
                );
              });
            })()}
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center bg-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg border border-gray-100">
              <div>
                <p className="text-xs text-gray-500 font-medium">Total</p>
                <p className="text-sm font-bold text-gray-900">{totalBooks}</p>
              </div>
            </div>
          </div>
          
          {/* Hover tooltip placeholder */}
          <div className="absolute inset-0 pointer-events-none">
            {/* This can be used for hover effects later */}
          </div>
        </div>
      </div>

      {/* Category List */}
      <div className="space-y-2">
        {displayCategories.map((category, index) => (
          <div key={category.name} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-all duration-200 group">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div 
                className={`w-4 h-4 rounded-full flex-shrink-0 shadow-sm`}
                style={{ backgroundColor: strokeColors[index] || '#6b7280' }}
              ></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 truncate">{category.name}</span>
                  <div className="text-right ml-3">
                    <p className="text-sm font-semibold text-gray-900">{category.count}</p>
                    <p className="text-xs text-gray-500">{category.percentage}%</p>
                  </div>
                </div>
                {category.books && category.books.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    {category.books.slice(0, 2).map(book => book.title).join(', ')}
                    {category.books.length > 2 && ` +${category.books.length - 2} more`}
                  </div>
                )}
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-16 ml-3">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="h-1.5 rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    width: `${category.percentage}%`,
                    backgroundColor: strokeColors[index] || '#6b7280'
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show more indicator */}
      {!showAll && categories.length > 4 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <button 
            onClick={() => setShowAll(true)}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-700 py-2"
          >
            +{categories.length - 4} more categories
          </button>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-lg font-bold text-blue-600">{categories.length}</div>
            <div className="text-xs text-blue-600 font-medium">Categories</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-lg font-bold text-purple-600">
              {categories.length > 0 ? Math.round(totalBooks / categories.length) : 0}
            </div>
            <div className="text-xs text-purple-600 font-medium">Avg Books</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-lg font-bold text-green-600">
              {categories.length > 0 ? categories[0]?.percentage || 0 : 0}%
            </div>
            <div className="text-xs text-green-600 font-medium">Top Category</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopCategories;