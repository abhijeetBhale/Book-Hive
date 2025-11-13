import { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { booksAPI } from '../utils/api';
import BookCard from '../components/books/BookCard';
import { Loader, X, ChevronDown, SlidersHorizontal, Search as SearchIcon } from 'lucide-react';
import StyledSearchInput from '../components/ui/StyledSearchInput';
import AdvancedSearchModal from '../components/search/AdvancedSearchModal';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import toast from 'react-hot-toast';
import { getFullImageUrl, preloadImages } from '../utils/imageHelpers';

// --- DATA FOR FILTERS ---

const bookCategories = [
    "All", "Fiction", "Non-Fiction", "Science Fiction", "Fantasy", "Mystery", 
    "Thriller", "Horror", "Romance", "Historical Fiction", "Biography", 
    "Autobiography", "Memoir", "Self-Help", "Business", "History", "Science",
    "Philosophy", "Psychology", "Travel", "Cooking", "Art", "Poetry", 
    "Graphic Novel", "Young Adult", "Children's"
];

const bookLanguages = [
    "All", "English", "Spanish", "French", "German", "Mandarin", "Japanese",
    "Russian", "Arabic", "Portuguese", "Hindi", "Bengali", "Italian", 
    "Dutch", "Korean", "Turkish", "Other"
];


// --- STYLED COMPONENTS ---
const PageWrapper = styled.div`
  background-color: #f8fafc;
  min-height: 100vh;
`;

const HeaderSection = styled.header`
  padding: 5rem 1rem;
  text-align: center;
  background: linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%);
`;

const Title = styled.h1`
  font-size: 3.5rem;
  font-weight: 900;
  color: #111827;
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #4b5563;
  max-width: 48rem;
  margin: 0 auto 2.5rem;
`;

const MainContent = styled.main`
  max-width: 80rem;
  margin: 0 auto;
  padding: 2rem 1rem 3rem;
  display: flex;
`;

const SidebarToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  position: fixed;
  top: 100px;
  left: 1rem;
  z-index: 40;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  transition: all 0.2s ease;

  &:hover {
    background-color: #f9fafb;
  }

  @media (min-width: 1024px) {
    display: none;
  }
`;

const ControlsWrapper = styled.aside`
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  height: calc(100vh - 120px);
  position: sticky;
  top: 100px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
  overflow-y: auto;
  flex-shrink: 0;
  width: 260px;
  margin-right: 2rem;
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;

  @media (max-width: 1023px) {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    border-radius: 0;
    z-index: 50;
    transform: translateX(-100%);
    ${({ $isOpen }) =>
      $isOpen &&
      css`
        transform: translateX(0);
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      `}
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1rem;

  h3 {
    font-size: 1.25rem;
    font-weight: 700;
  }

  @media (min-width: 1024px) {
    display: none;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
`;

const ControlGroup = styled.div`
  margin-bottom: 1rem;
  &:last-child {
    margin-bottom: 0;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
  background-color: #f9fafb;
`;

const BookGridContainer = styled.div`
  width: 100%;
`;

const BookGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 2rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
  width: 100%;
`;

const ErrorMessage = styled.p`
  text-align: center;
  font-size: 1.125rem;
  color: #ef4444;
  width: 100%;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
`;

const Checkbox = styled.input`
  cursor: pointer;
`;

const AccordionHeader = styled.button`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  background: none;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  text-align: left;

  span {
    font-size: 1.125rem;
    font-weight: 600;
  }

  svg {
    transition: transform 0.2s ease;
    ${({ $isOpen }) => $isOpen && 'transform: rotate(180deg);'}
  }
`;

const AccordionContent = styled.div`
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
  padding-top: 0.5rem;
  ${({ $isOpen }) =>
    $isOpen &&
    css`
      max-height: 300px;
      overflow-y: auto;
    `}
`;

// Accordion Component
const Accordion = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div>
            <AccordionHeader $isOpen={isOpen} onClick={() => setIsOpen(!isOpen)}>
                <span>{title}</span>
                <ChevronDown size={20} />
            </AccordionHeader>
            <AccordionContent $isOpen={isOpen}>{children}</AccordionContent>
        </div>
    );
};

// --- MAIN COMPONENT ---
const Books = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({});

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('title-asc');
    const [selectedGenre, setSelectedGenre] = useState('All');
    const [selectedLanguage, setSelectedLanguage] = useState('All');
    const [filterAvailable, setFilterAvailable] = useState(false);
    const [currentFilters, setCurrentFilters] = useState({});

    useEffect(() => {
        fetchBooks();
    }, [currentFilters]);

    const fetchBooks = async (filters = {}) => {
        try {
            setLoading(true);
            const searchParams = {
                ...currentFilters,
                ...filters,
                search: searchQuery,
                category: selectedGenre !== 'All' ? selectedGenre : '',
                language: selectedLanguage !== 'All' ? selectedLanguage : '',
                isAvailable: filterAvailable ? 'true' : '',
                sortBy: sortOrder.split('-')[0],
                sortOrder: sortOrder.split('-')[1],
                limit: 20
            };

            const response = await booksAPI.getAll(searchParams);
            const fetchedBooks = response.data.books || [];
            setBooks(fetchedBooks);
            setPagination(response.data.pagination || {});
            setError(null);
            
            // Preload book cover images for better performance
            const imageUrls = fetchedBooks
              .map(book => getFullImageUrl(book.coverImage))
              .filter(url => url && !url.includes('placehold.co'));
            
            if (imageUrls.length > 0) {
              preloadImages(imageUrls).catch(err => {
                // Image preload failed - non-critical
              });
            }
        } catch (err) {
            setError('Failed to load books. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleAdvancedSearch = (filters) => {
        try {
            setCurrentFilters(filters);
            // Reset basic filters when using advanced search
            setSearchQuery(filters.search || '');
            setSelectedGenre(filters.category || 'All');
            setSelectedLanguage(filters.language || 'All');
            setFilterAvailable(filters.isAvailable === 'true');
            setSortOrder(`${filters.sortBy || 'createdAt'}-${filters.sortOrder || 'desc'}`);
        } catch (error) {
            toast.error('Error applying search filters');
        }
    };



    return (
        <PageWrapper>
            <HeaderSection>
                <Title>Our Expansive Collection</Title>
                <Subtitle>
                    Dive into a universe of stories. Search for your next adventure or browse through the shelves of our community's library.
                </Subtitle>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <StyledSearchInput
                        placeholder="Search by title or author..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button
                        onClick={() => setIsAdvancedSearchOpen(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            background: '#4F46E5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#4338ca'}
                        onMouseOut={(e) => e.target.style.background = '#4F46E5'}
                    >
                        <SearchIcon size={16} />
                        Advanced Search
                    </button>
                </div>
            </HeaderSection>
            
            <SidebarToggle onClick={() => setIsSidebarOpen(true)}>
                <SlidersHorizontal size={18} /> Filters
            </SidebarToggle>

            <MainContent>
                <ControlsWrapper $isOpen={isSidebarOpen}>
                    <SidebarHeader>
                        <h3>Filters</h3>
                        <CloseButton onClick={() => setIsSidebarOpen(false)}>
                            <X size={24} />
                        </CloseButton>
                    </SidebarHeader>

                    <ControlGroup>
                        <Accordion title="Category">
                            <Select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}>
                                {bookCategories.map(genre => <option key={genre} value={genre}>{genre}</option>)}
                            </Select>
                        </Accordion>
                    </ControlGroup>
                    
                    <ControlGroup>
                        <Accordion title="Language">
                            <Select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
                                {bookLanguages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                            </Select>
                        </Accordion>
                    </ControlGroup>
                    
                    <ControlGroup>
                        <Accordion title="Filter">
                            <CheckboxLabel>
                                <Checkbox
                                    type="checkbox"
                                    checked={filterAvailable}
                                    onChange={(e) => setFilterAvailable(e.target.checked)}
                                />
                                Available Now
                            </CheckboxLabel>
                        </Accordion>
                    </ControlGroup>
                    
                    <ControlGroup>
                        <Accordion title="Sort">
                            <Select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                                <option value="title-asc">Title (A-Z)</option>
                                <option value="title-desc">Title (Z-A)</option>
                            </Select>
                        </Accordion>
                    </ControlGroup>
                </ControlsWrapper>
                
                <BookGridContainer>
                    {loading ? (
                        <LoadingContainer>
                            <Loader size={48} color="#4F46E5" className="animate-spin" />
                        </LoadingContainer>
                    ) : error ? (
                        <ErrorMessage>{error}</ErrorMessage>
                    ) : (
                        <>
                            {Object.keys(currentFilters).length > 0 && (
                                <div style={{ 
                                    padding: '1rem', 
                                    background: '#f0f9ff', 
                                    borderRadius: '8px', 
                                    marginBottom: '1rem',
                                    border: '1px solid #bae6fd'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.875rem', color: '#0369a1', fontWeight: '500' }}>
                                            Advanced filters applied • {books.length} results
                                        </span>
                                        <button
                                            onClick={() => {
                                                setCurrentFilters({});
                                                setSearchQuery('');
                                                setSelectedGenre('All');
                                                setSelectedLanguage('All');
                                                setFilterAvailable(false);
                                                setSortOrder('title-asc');
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#0369a1',
                                                fontSize: '0.875rem',
                                                cursor: 'pointer',
                                                textDecoration: 'underline'
                                            }}
                                        >
                                            Clear filters
                                        </button>
                                    </div>
                                </div>
                            )}
                            <BookGrid>
                                {books.map((book) => (
                                    <BookCard key={book._id} book={book} />
                                ))}
                            </BookGrid>
                            {pagination && pagination.pages > 1 && (
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    alignItems: 'center', 
                                    gap: '1rem', 
                                    marginTop: '2rem',
                                    padding: '1rem'
                                }}>
                                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                        Page {pagination.page} of {pagination.pages} • {pagination.total} total books
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </BookGridContainer>
            </MainContent>

            {/* Advanced Search Modal */}
            {isAdvancedSearchOpen && (
                <ErrorBoundary>
                    <AdvancedSearchModal
                        isOpen={isAdvancedSearchOpen}
                        onClose={() => setIsAdvancedSearchOpen(false)}
                        onSearch={handleAdvancedSearch}
                        initialFilters={currentFilters}
                    />
                </ErrorBoundary>
            )}
        </PageWrapper>
    );
};

export default Books;