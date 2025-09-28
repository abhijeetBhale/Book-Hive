import React, { useState, useEffect, useMemo } from 'react';
import styled, { css } from 'styled-components';
import { booksAPI } from '../utils/api';
import BookCard from '../components/books/BookCard';
import { Loader, X, ChevronDown, SlidersHorizontal } from 'lucide-react';
import StyledSearchInput from '../components/ui/StyledSearchInput'; // Import the new component

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
    ${({ isOpen }) =>
      isOpen &&
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
    ${({ isOpen }) => isOpen && 'transform: rotate(180deg);'}
  }
`;

const AccordionContent = styled.div`
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
  padding-top: 0.5rem;
  ${({ isOpen }) =>
    isOpen &&
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
            <AccordionHeader isOpen={isOpen} onClick={() => setIsOpen(!isOpen)}>
                <span>{title}</span>
                <ChevronDown size={20} />
            </AccordionHeader>
            <AccordionContent isOpen={isOpen}>{children}</AccordionContent>
        </div>
    );
};

// --- MAIN COMPONENT ---
const Books = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('title-asc');
    const [selectedGenre, setSelectedGenre] = useState('All');
    const [selectedLanguage, setSelectedLanguage] = useState('All');
    const [filterAvailable, setFilterAvailable] = useState(false);

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                setLoading(true);
                const response = await booksAPI.getAll();
                setBooks(response.data.books || []);
                setError(null);
            } catch (err) {
                setError('Failed to load books. Please try again later.');
                console.error('Error fetching books:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchBooks();
    }, []);

    const filteredAndSortedBooks = useMemo(() => {
        let result = [...books];

        if (filterAvailable) {
            result = result.filter(book => book.isAvailable);
        }

        if (selectedGenre !== 'All') {
            result = result.filter(book => book.genre === selectedGenre);
        }
        
        if (selectedLanguage !== 'All') {
            result = result.filter(book => book.language === selectedLanguage);
        }

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            result = result.filter(book =>
                book.title.toLowerCase().includes(lowercasedQuery) ||
                book.author.toLowerCase().includes(lowercasedQuery)
            );
        }

        result.sort((a, b) => {
            if (sortOrder === 'title-asc') return a.title.localeCompare(b.title);
            if (sortOrder === 'title-desc') return b.title.localeCompare(a.title);
            return 0;
        });

        return result;
    }, [books, searchQuery, sortOrder, selectedGenre, selectedLanguage, filterAvailable]);

    return (
        <PageWrapper>
            <HeaderSection>
                <Title>Our Expansive Collection</Title>
                <Subtitle>
                    Dive into a universe of stories. Search for your next adventure or browse through the shelves of our community's library.
                </Subtitle>
                {/* ========== REPLACE SEARCH BAR HERE ========== */}
                <StyledSearchInput
                    placeholder="Search by title or author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {/* ============================================= */}
            </HeaderSection>
            
            <SidebarToggle onClick={() => setIsSidebarOpen(true)}>
                <SlidersHorizontal size={18} /> Filters
            </SidebarToggle>

            <MainContent>
                <ControlsWrapper isOpen={isSidebarOpen}>
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
                        <BookGrid>
                            {filteredAndSortedBooks.map((book) => (
                                <BookCard key={book._id} book={book} />
                            ))}
                        </BookGrid>
                    )}
                </BookGridContainer>
            </MainContent>
        </PageWrapper>
    );
};

export default Books;