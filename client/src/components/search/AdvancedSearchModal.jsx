import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Search, MapPin, Filter, Scan } from 'lucide-react';
import { booksAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  
  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
    flex: 1;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  color: #6b7280;
  transition: all 0.2s;
  
  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const SearchSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const Select = styled.select`
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const Input = styled.input`
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
`;

const Checkbox = styled.input`
  width: 1rem;
  height: 1rem;
  accent-color: #4f46e5;
`;

const LocationSection = styled.div`
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
`;

const LocationInput = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 0.5rem;
  align-items: end;
`;

const DistanceSlider = styled.input`
  width: 100%;
  margin-top: 0.5rem;
`;

const ISBNSection = styled.div`
  margin-bottom: 2rem;
  padding: 1rem;
  background: #fef3c7;
  border-radius: 8px;
  border: 1px solid #fbbf24;
`;

const ISBNInput = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: end;
`;

const ScanButton = styled.button`
  padding: 0.5rem 1rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  
  &:hover {
    background: #4338ca;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  gap: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${props => props.variant === 'primary' ? `
    background: #4f46e5;
    color: white;
    border: 1px solid #4f46e5;
    
    &:hover {
      background: #4338ca;
    }
  ` : `
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    
    &:hover {
      background: #f9fafb;
    }
  `}
`;

const AdvancedSearchModal = ({ isOpen, onClose, onSearch, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    search: '',
    category: 'All',
    author: '',
    condition: 'All',
    language: 'All',
    genre: 'All',
    minYear: '',
    maxYear: '',
    isAvailable: '',
    forBorrowing: '',
    isbn: '',
    tags: '',
    latitude: '',
    longitude: '',
    maxDistance: '10000',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters
  });

  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    authors: [],
    conditions: [],
    languages: [],
    genres: [],
    yearRange: { minYear: 1800, maxYear: new Date().getFullYear() }
  });

  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Set default options immediately to prevent errors
      setFilterOptions({
        categories: ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Mystery', 'Romance'],
        authors: [],
        conditions: ['New', 'Like New', 'Very Good', 'Good', 'Fair', 'Poor'],
        languages: ['English', 'Spanish', 'French', 'German', 'Other'],
        genres: ['Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Thriller'],
        yearRange: { minYear: 1800, maxYear: new Date().getFullYear() }
      });
      
      // Then try to load actual options
      loadFilterOptions();
    }
  }, [isOpen]);

  const loadFilterOptions = async () => {
    setIsLoadingOptions(true);
    try {
      const response = await booksAPI.getFilterOptions();
      
      const data = response.data || response;
      
      setFilterOptions(data || {
        categories: [],
        authors: [],
        conditions: [],
        languages: [],
        genres: [],
        yearRange: { minYear: 1800, maxYear: new Date().getFullYear() }
      });
    } catch (error) {
      toast.error('Failed to load filter options');
      // Set default values on error
      setFilterOptions({
        categories: [],
        authors: [],
        conditions: [],
        languages: [],
        genres: [],
        yearRange: { minYear: 1800, maxYear: new Date().getFullYear() }
      });
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFilters(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        }));
        toast.success('Location detected successfully!');
        setIsGettingLocation(false);
      },
      (error) => {
        toast.error('Failed to get your location');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleISBNScan = () => {
    // This would integrate with a barcode scanning library
    // For now, we'll show a placeholder message
    toast('Barcode scanning feature coming soon!', {
      icon: '📱',
      duration: 3000
    });
  };

  const handleSearch = () => {
    // Remove empty values
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== 'All') {
        acc[key] = value;
      }
      return acc;
    }, {});

    onSearch(cleanFilters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      search: '',
      category: 'All',
      author: '',
      condition: 'All',
      language: 'All',
      genre: 'All',
      minYear: '',
      maxYear: '',
      isAvailable: '',
      forBorrowing: '',
      isbn: '',
      tags: '',
      latitude: '',
      longitude: '',
      maxDistance: '10000',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  if (!isOpen) return null;

  // Show loading state while filter options are being loaded
  if (isLoadingOptions && (!filterOptions.categories || filterOptions.categories.length === 0)) {
    return (
      <ModalOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
        <ModalContent>
          <ModalHeader>
            <h2>Advanced Search</h2>
            <CloseButton onClick={onClose}>
              <X size={24} />
            </CloseButton>
          </ModalHeader>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '3rem',
            color: '#6b7280'
          }}>
            Loading search options...
          </div>
        </ModalContent>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <ModalContent>
        <ModalHeader>
          <h2>Advanced Search</h2>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {/* Main Search */}
          <SearchSection>
            <SectionTitle>
              <Search size={20} />
              Search Terms
            </SectionTitle>
            <SearchInput
              type="text"
              placeholder="Search by title, author, description, or keywords..."
              value={filters.search}
              onChange={(e) => handleInputChange('search', e.target.value)}
            />
          </SearchSection>

          {/* Basic Filters */}
          <SearchSection>
            <SectionTitle>
              <Filter size={20} />
              Filters
            </SectionTitle>
            <FilterGrid>
              <FilterGroup>
                <Label>Category</Label>
                <Select
                  value={filters.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  disabled={isLoadingOptions}
                >
                  <option value="All">All Categories</option>
                  {(filterOptions.categories || []).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
              </FilterGroup>

              <FilterGroup>
                <Label>Author</Label>
                <Input
                  type="text"
                  placeholder="Author name..."
                  value={filters.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                />
              </FilterGroup>

              <FilterGroup>
                <Label>Condition</Label>
                <Select
                  value={filters.condition}
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                  disabled={isLoadingOptions}
                >
                  <option value="All">Any Condition</option>
                  {(filterOptions.conditions || []).map(condition => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </Select>
              </FilterGroup>

              <FilterGroup>
                <Label>Language</Label>
                <Select
                  value={filters.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  disabled={isLoadingOptions}
                >
                  <option value="All">All Languages</option>
                  {(filterOptions.languages || []).map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </Select>
              </FilterGroup>

              <FilterGroup>
                <Label>Genre</Label>
                <Select
                  value={filters.genre}
                  onChange={(e) => handleInputChange('genre', e.target.value)}
                  disabled={isLoadingOptions}
                >
                  <option value="All">All Genres</option>
                  {(filterOptions.genres || []).map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </Select>
              </FilterGroup>

              <FilterGroup>
                <Label>Sort By</Label>
                <Select
                  value={filters.sortBy}
                  onChange={(e) => handleInputChange('sortBy', e.target.value)}
                >
                  <option value="createdAt">Date Added</option>
                  <option value="title">Title</option>
                  <option value="author">Author</option>
                  <option value="publicationYear">Publication Year</option>
                  <option value="viewCount">Popularity</option>
                </Select>
              </FilterGroup>
            </FilterGrid>

            {/* Publication Year Range */}
            <FilterGrid>
              <FilterGroup>
                <Label>From Year</Label>
                <Input
                  type="number"
                  min={filterOptions.yearRange?.minYear || 1800}
                  max={filterOptions.yearRange?.maxYear || new Date().getFullYear()}
                  placeholder={(filterOptions.yearRange?.minYear || 1800).toString()}
                  value={filters.minYear}
                  onChange={(e) => handleInputChange('minYear', e.target.value)}
                />
              </FilterGroup>

              <FilterGroup>
                <Label>To Year</Label>
                <Input
                  type="number"
                  min={filterOptions.yearRange?.minYear || 1800}
                  max={filterOptions.yearRange?.maxYear || new Date().getFullYear()}
                  placeholder={(filterOptions.yearRange?.maxYear || new Date().getFullYear()).toString()}
                  value={filters.maxYear}
                  onChange={(e) => handleInputChange('maxYear', e.target.value)}
                />
              </FilterGroup>

              <FilterGroup>
                <Label>Sort Order</Label>
                <Select
                  value={filters.sortOrder}
                  onChange={(e) => handleInputChange('sortOrder', e.target.value)}
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </Select>
              </FilterGroup>
            </FilterGrid>
          </SearchSection>

          {/* Availability Filters */}
          <SearchSection>
            <CheckboxGroup>
              <CheckboxLabel>
                <Checkbox
                  type="checkbox"
                  checked={filters.isAvailable === 'true'}
                  onChange={(e) => handleInputChange('isAvailable', e.target.checked ? 'true' : '')}
                />
                Available Now
              </CheckboxLabel>
              <CheckboxLabel>
                <Checkbox
                  type="checkbox"
                  checked={filters.forBorrowing === 'true'}
                  onChange={(e) => handleInputChange('forBorrowing', e.target.checked ? 'true' : '')}
                />
                Available for Borrowing
              </CheckboxLabel>
            </CheckboxGroup>
          </SearchSection>

          {/* Location-based Search */}
          <LocationSection>
            <SectionTitle>
              <MapPin size={20} />
              Location-based Search
            </SectionTitle>
            <LocationInput>
              <FilterGroup>
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g., 40.7128"
                  value={filters.latitude}
                  onChange={(e) => handleInputChange('latitude', e.target.value)}
                />
              </FilterGroup>
              <FilterGroup>
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g., -74.0060"
                  value={filters.longitude}
                  onChange={(e) => handleInputChange('longitude', e.target.value)}
                />
              </FilterGroup>
              <Button
                type="button"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? 'Getting...' : 'Use My Location'}
              </Button>
            </LocationInput>
            <FilterGroup style={{ marginTop: '1rem' }}>
              <Label>
                Max Distance: {Math.round(filters.maxDistance / 1000)} km
              </Label>
              <DistanceSlider
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={filters.maxDistance}
                onChange={(e) => handleInputChange('maxDistance', e.target.value)}
              />
            </FilterGroup>
          </LocationSection>

          {/* ISBN Search */}
          <ISBNSection>
            <SectionTitle>
              <Scan size={20} />
              ISBN Search
            </SectionTitle>
            <ISBNInput>
              <FilterGroup style={{ flex: 1 }}>
                <Label>ISBN</Label>
                <Input
                  type="text"
                  placeholder="Enter ISBN or scan barcode..."
                  value={filters.isbn}
                  onChange={(e) => handleInputChange('isbn', e.target.value)}
                />
              </FilterGroup>
              <ScanButton onClick={handleISBNScan}>
                <Scan size={16} />
                Scan
              </ScanButton>
            </ISBNInput>
          </ISBNSection>

          {/* Tags */}
          <SearchSection>
            <FilterGroup>
              <Label>Tags (comma-separated)</Label>
              <Input
                type="text"
                placeholder="e.g., bestseller, classic, award-winner"
                value={filters.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
              />
            </FilterGroup>
          </SearchSection>
        </ModalBody>

        <ModalFooter>
          <Button onClick={handleReset}>
            Reset All
          </Button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSearch}>
              Search Books
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default AdvancedSearchModal;