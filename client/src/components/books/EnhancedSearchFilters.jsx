import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, MapPin } from 'lucide-react';
import { booksAPI } from '../../utils/api';

const EnhancedSearchFilters = ({ onFiltersChange, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    author: '',
    condition: '',
    language: '',
    genre: '',
    minYear: '',
    maxYear: '',
    minPrice: '',
    maxPrice: '',
    isAvailable: '',
    bookType: 'borrowing',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    useLocation: false,
    maxDistance: 10,
    ...initialFilters
  });

  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    authors: [],
    conditions: [],
    languages: [],
    genres: [],
    yearRange: { minYear: 1800, maxYear: new Date().getFullYear() },
    priceRange: { minPrice: 0, maxPrice: 100 },
    sortOptions: []
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange]);

  const fetchFilterOptions = async () => {
    try {
      setIsLoading(true);
      const options = await booksAPI.getEnhancedFilters();
      setFilterOptions(options);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      author: '',
      condition: '',
      language: '',
      genre: '',
      minYear: '',
      maxYear: '',
      minPrice: '',
      maxPrice: '',
      isAvailable: '',
      bookType: 'borrowing',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      useLocation: false,
      maxDistance: 10
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'search' || key === 'sortBy' || key === 'sortOrder' || key === 'bookType') return false;
    return value !== '' && value !== false && value !== 10;
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search books by title, author, or description..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Quick Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Categories</option>
          {filterOptions.categories.map(cat => (
            <option key={cat.name} value={cat.name}>
              {cat.name} ({cat.count})
            </option>
          ))}
        </select>

        <select
          value={filters.condition}
          onChange={(e) => handleFilterChange('condition', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Conditions</option>
          {filterOptions.conditions.map(condition => (
            <option key={condition} value={condition}>{condition}</option>
          ))}
        </select>

        <select
          value={filters.bookType}
          onChange={(e) => handleFilterChange('bookType', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {filterOptions.bookTypes?.map(type => (
            <option key={type.value} value={type.value}>{type.name}</option>
          ))}
        </select>

        <select
          value={`${filters.sortBy}_${filters.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split('_');
            handleFilterChange('sortBy', sortBy);
            handleFilterChange('sortOrder', sortOrder);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {filterOptions.sortOptions?.map(option => (
            <option key={option.value} value={option.value}>{option.name}</option>
          ))}
        </select>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Advanced Filters
          <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 text-red-600 hover:text-red-800 transition-colors"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.language}
              onChange={(e) => handleFilterChange('language', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Languages</option>
              {filterOptions.languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>

            <select
              value={filters.genre}
              onChange={(e) => handleFilterChange('genre', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Genres</option>
              {filterOptions.genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>

            <select
              value={filters.isAvailable}
              onChange={(e) => handleFilterChange('isAvailable', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Availability</option>
              {filterOptions.availability?.map(avail => (
                <option key={avail.value} value={avail.value}>{avail.name}</option>
              ))}
            </select>
          </div>

          {/* Year Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Publication Year From</label>
              <input
                type="number"
                min={filterOptions.yearRange.minYear}
                max={filterOptions.yearRange.maxYear}
                value={filters.minYear}
                onChange={(e) => handleFilterChange('minYear', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={filterOptions.yearRange.minYear.toString()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Publication Year To</label>
              <input
                type="number"
                min={filterOptions.yearRange.minYear}
                max={filterOptions.yearRange.maxYear}
                value={filters.maxYear}
                onChange={(e) => handleFilterChange('maxYear', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={filterOptions.yearRange.maxYear.toString()}
              />
            </div>
          </div>

          {/* Price Range (for books for sale) */}
          {filters.bookType === 'selling' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Price ($)</label>
                <input
                  type="number"
                  min="0"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price ($)</label>
                <input
                  type="number"
                  min="0"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1000"
                />
              </div>
            </div>
          )}

          {/* Location Filter */}
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.useLocation}
                onChange={(e) => handleFilterChange('useLocation', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Search near my location</span>
            </label>
            
            {filters.useLocation && (
              <div className="ml-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Distance: {filters.maxDistance} km
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={filters.maxDistance}
                  onChange={(e) => handleFilterChange('maxDistance', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 km</span>
                  <span>100 km</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSearchFilters;