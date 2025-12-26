import React, { useState, useEffect } from 'react';
import { Settings, Save, Plus, X, MapPin, Book, Heart, Globe, Target } from 'lucide-react';
import { usersAPI, booksAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const ReadingPreferences = ({ showTitle = true }) => {
  const [preferences, setPreferences] = useState({
    favoriteGenres: [],
    favoriteAuthors: [],
    readingGoals: {
      booksPerMonth: 0,
      currentStreak: 0,
      longestStreak: 0
    },
    preferredLanguages: ['English'],
    bookFormats: ['physical'],
    maxDistance: 10
  });

  const [filterOptions, setFilterOptions] = useState({
    genres: [],
    languages: [],
    authors: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newGenre, setNewGenre] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [showGenreInput, setShowGenreInput] = useState(false);
  const [showAuthorInput, setShowAuthorInput] = useState(false);

  useEffect(() => {
    fetchPreferences();
    fetchFilterOptions();
  }, []);

  const fetchPreferences = async () => {
    try {
      const data = await usersAPI.getReadingPreferences();
      setPreferences(data.readingPreferences);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to load reading preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const data = await booksAPI.getEnhancedFilters();
      setFilterOptions({
        genres: data.genres || [],
        languages: data.languages || [],
        authors: data.authors || []
      });
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await usersAPI.updateReadingPreferences(preferences);
      toast.success('Reading preferences updated successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const addGenre = () => {
    if (newGenre.trim() && !preferences.favoriteGenres.includes(newGenre.trim())) {
      setPreferences(prev => ({
        ...prev,
        favoriteGenres: [...prev.favoriteGenres, newGenre.trim()]
      }));
      setNewGenre('');
      setShowGenreInput(false);
    }
  };

  const removeGenre = (genre) => {
    setPreferences(prev => ({
      ...prev,
      favoriteGenres: prev.favoriteGenres.filter(g => g !== genre)
    }));
  };

  const addAuthor = () => {
    if (newAuthor.trim() && !preferences.favoriteAuthors.includes(newAuthor.trim())) {
      setPreferences(prev => ({
        ...prev,
        favoriteAuthors: [...prev.favoriteAuthors, newAuthor.trim()]
      }));
      setNewAuthor('');
      setShowAuthorInput(false);
    }
  };

  const removeAuthor = (author) => {
    setPreferences(prev => ({
      ...prev,
      favoriteAuthors: prev.favoriteAuthors.filter(a => a !== author)
    }));
  };

  const handleLanguageChange = (language, checked) => {
    setPreferences(prev => ({
      ...prev,
      preferredLanguages: checked
        ? [...prev.preferredLanguages, language]
        : prev.preferredLanguages.filter(l => l !== language)
    }));
  };

  const handleFormatChange = (format, checked) => {
    setPreferences(prev => ({
      ...prev,
      bookFormats: checked
        ? [...prev.bookFormats, format]
        : prev.bookFormats.filter(f => f !== format)
    }));
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      {showTitle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Reading Preferences</h2>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Favorite Genres */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-medium text-gray-900">Favorite Genres</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {preferences.favoriteGenres.map(genre => (
            <span
              key={genre}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {genre}
              <button
                onClick={() => removeGenre(genre)}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          
          {showGenreInput ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addGenre()}
                placeholder="Enter genre"
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <button
                onClick={addGenre}
                className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowGenreInput(false);
                  setNewGenre('');
                }}
                className="px-2 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowGenreInput(true)}
              className="inline-flex items-center gap-1 px-3 py-1 border-2 border-dashed border-gray-300 text-gray-600 rounded-full text-sm hover:border-blue-400 hover:text-blue-600"
            >
              <Plus className="w-3 h-3" />
              Add Genre
            </button>
          )}
        </div>

        {/* Popular Genres */}
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Popular genres:</p>
          <div className="flex flex-wrap gap-2">
            {filterOptions.genres.slice(0, 10).map(genre => (
              !preferences.favoriteGenres.includes(genre) && (
                <button
                  key={genre}
                  onClick={() => setPreferences(prev => ({
                    ...prev,
                    favoriteGenres: [...prev.favoriteGenres, genre]
                  }))}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                >
                  + {genre}
                </button>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Favorite Authors */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Book className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-medium text-gray-900">Favorite Authors</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {preferences.favoriteAuthors.map(author => (
            <span
              key={author}
              className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
            >
              {author}
              <button
                onClick={() => removeAuthor(author)}
                className="hover:bg-green-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          
          {showAuthorInput ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addAuthor()}
                placeholder="Enter author name"
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <button
                onClick={addAuthor}
                className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAuthorInput(false);
                  setNewAuthor('');
                }}
                className="px-2 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthorInput(true)}
              className="inline-flex items-center gap-1 px-3 py-1 border-2 border-dashed border-gray-300 text-gray-600 rounded-full text-sm hover:border-green-400 hover:text-green-600"
            >
              <Plus className="w-3 h-3" />
              Add Author
            </button>
          )}
        </div>
      </div>

      {/* Reading Goals */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-medium text-gray-900">Reading Goals</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Books per Month
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={preferences.readingGoals.booksPerMonth}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                readingGoals: {
                  ...prev.readingGoals,
                  booksPerMonth: parseInt(e.target.value) || 0
                }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Streak
            </label>
            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
              {preferences.readingGoals.currentStreak} days
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longest Streak
            </label>
            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
              {preferences.readingGoals.longestStreak} days
            </div>
          </div>
        </div>
      </div>

      {/* Preferred Languages */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-medium text-gray-900">Preferred Languages</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {filterOptions.languages.map(language => (
            <label key={language} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.preferredLanguages.includes(language)}
                onChange={(e) => handleLanguageChange(language, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{language}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Book Formats */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Book className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-medium text-gray-900">Preferred Book Formats</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {['physical', 'ebook', 'audiobook'].map(format => (
            <label key={format} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.bookFormats.includes(format)}
                onChange={(e) => handleFormatChange(format, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 capitalize">{format}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Location Preferences */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-medium text-gray-900">Location Preferences</h3>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Distance for Book Search: {preferences.maxDistance} km
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={preferences.maxDistance}
            onChange={(e) => setPreferences(prev => ({
              ...prev,
              maxDistance: parseInt(e.target.value)
            }))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 km</span>
            <span>50 km</span>
            <span>100 km</span>
          </div>
        </div>
      </div>

      {!showTitle && (
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReadingPreferences;