import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Search, Book, ExternalLink, Check, Image as ImageIcon, Loader } from 'lucide-react';
import { bookSearchAPI } from '../../utils/api';
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
  max-width: 1000px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  
  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
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

const SearchSection = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const SearchInput = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
`;

const Input = styled.input`
  flex: 1;
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

const SearchButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
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

const ResultsSection = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
  
  .spinner {
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: #6b7280;
  
  .icon {
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: #374151;
  }
  
  p {
    margin: 0;
  }
`;

const BookGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const BookCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;
  background: white;
  
  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const BookCover = styled.div`
  position: relative;
  height: 200px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.2s;
  }
  
  &:hover img {
    transform: scale(1.05);
  }
  
  .no-cover {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #9ca3af;
    
    svg {
      margin-bottom: 0.5rem;
    }
  }
  
  .source-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }
`;

const BookInfo = styled.div`
  padding: 1rem;
`;

const BookTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const BookAuthor = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
`;

const BookMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 1rem;
`;

const BookDescription = styled.p`
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.4;
  margin: 0 0 1rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const BookActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &.primary {
    background: #4f46e5;
    color: white;
    border: 1px solid #4f46e5;
    
    &:hover {
      background: #4338ca;
    }
  }
  
  &.secondary {
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    
    &:hover {
      background: #f9fafb;
    }
  }
`;

const CoverOptionsModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 1rem;
`;

const CoverOptionsContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 800px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  
  h3 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    font-weight: 600;
  }
`;

const CoverGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const CoverOption = styled.div`
  border: 2px solid ${props => props.$selected ? '#4f46e5' : '#e5e7eb'};
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #4f46e5;
  }
  
  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
  
  .cover-info {
    padding: 0.5rem;
    font-size: 0.75rem;
    color: #6b7280;
    text-align: center;
  }
`;

const BookSearchModal = ({ isOpen, onClose, onSelectBook }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showCoverOptions, setShowCoverOptions] = useState(false);
  const [selectedBookForCovers, setSelectedBookForCovers] = useState(null);
  const [coverOptions, setCoverOptions] = useState([]);
  const [selectedCover, setSelectedCover] = useState(null);
  const [loadingCovers, setLoadingCovers] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    
    try {
      const response = await bookSearchAPI.searchBooks(searchQuery);
      setSearchResults(response.books || []);
      
      if (response.books?.length === 0) {
        toast.info('No books found. Try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search books. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectBook = (book) => {
    onSelectBook({
      title: book.title,
      author: book.author,
      description: book.description,
      category: book.category,
      isbn: book.isbn,
      publicationYear: book.publicationYear,
      language: book.language,
      coverImage: book.coverImage,
      externalData: {
        source: book.source,
        id: book.id,
        rating: book.rating,
        ratingsCount: book.ratingsCount,
        pageCount: book.pageCount,
        publisher: book.publisher,
        previewLink: book.previewLink,
        infoLink: book.infoLink
      }
    });
    onClose();
  };

  const handleGetCovers = async (book) => {
    setSelectedBookForCovers(book);
    setLoadingCovers(true);
    setShowCoverOptions(true);
    
    try {
      const response = await bookSearchAPI.getBookCovers({
        title: book.title,
        author: book.author,
        isbn: book.isbn
      });
      
      setCoverOptions(response.covers || []);
      setSelectedCover(response.covers?.[0] || null);
    } catch (error) {
      console.error('Error getting covers:', error);
      toast.error('Failed to load cover options');
      setCoverOptions([]);
    } finally {
      setLoadingCovers(false);
    }
  };

  const handleSelectCover = () => {
    if (selectedCover && selectedBookForCovers) {
      const bookWithSelectedCover = {
        ...selectedBookForCovers,
        coverImage: selectedCover.url
      };
      handleSelectBook(bookWithSelectedCover);
    }
    setShowCoverOptions(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <ModalOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
        <ModalContent>
          <ModalHeader>
            <h2>Search Books Online</h2>
            <CloseButton onClick={onClose}>
              <X size={24} />
            </CloseButton>
          </ModalHeader>

          <SearchSection>
            <SearchInput>
              <Input
                type="text"
                placeholder="Search by title, author, or ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <SearchButton onClick={handleSearch} disabled={loading}>
                {loading ? <Loader className="spinner" size={16} /> : <Search size={16} />}
                Search
              </SearchButton>
            </SearchInput>
          </SearchSection>

          <ResultsSection>
            {loading ? (
              <LoadingState>
                <Loader className="spinner" size={32} />
                <p>Searching books from multiple sources...</p>
              </LoadingState>
            ) : !hasSearched ? (
              <EmptyState>
                <Book className="icon" size={48} />
                <h3>Search for Books</h3>
                <p>Enter a book title, author name, or ISBN to find books from multiple online sources.</p>
              </EmptyState>
            ) : searchResults.length === 0 ? (
              <EmptyState>
                <Book className="icon" size={48} />
                <h3>No Books Found</h3>
                <p>Try searching with different keywords or check your spelling.</p>
              </EmptyState>
            ) : (
              <BookGrid>
                {searchResults.map((book, index) => (
                  <BookCard key={`${book.source}-${book.id}-${index}`}>
                    <BookCover>
                      {book.coverImage ? (
                        <img 
                          src={book.coverImage} 
                          alt={book.title}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="no-cover" style={{ display: book.coverImage ? 'none' : 'flex' }}>
                        <ImageIcon size={32} />
                        <span>No Cover</span>
                      </div>
                      <div className="source-badge">
                        {book.source === 'google' ? 'Google Books' : 'Open Library'}
                      </div>
                    </BookCover>
                    
                    <BookInfo>
                      <BookTitle>{book.title}</BookTitle>
                      <BookAuthor>by {book.author}</BookAuthor>
                      
                      <BookMeta>
                        <span>{book.publicationYear || 'Unknown Year'}</span>
                        {book.pageCount && <span>{book.pageCount} pages</span>}
                        {book.rating && <span>★ {book.rating}</span>}
                      </BookMeta>
                      
                      {book.description && (
                        <BookDescription>{book.description}</BookDescription>
                      )}
                      
                      <BookActions>
                        <ActionButton 
                          className="primary" 
                          onClick={() => handleSelectBook(book)}
                        >
                          <Check size={14} />
                          Select
                        </ActionButton>
                        <ActionButton 
                          className="secondary" 
                          onClick={() => handleGetCovers(book)}
                        >
                          <ImageIcon size={14} />
                          Covers
                        </ActionButton>
                        {book.previewLink && (
                          <ActionButton 
                            className="secondary" 
                            onClick={() => window.open(book.previewLink, '_blank')}
                          >
                            <ExternalLink size={14} />
                          </ActionButton>
                        )}
                      </BookActions>
                    </BookInfo>
                  </BookCard>
                ))}
              </BookGrid>
            )}
          </ResultsSection>
        </ModalContent>
      </ModalOverlay>

      {/* Cover Options Modal */}
      {showCoverOptions && (
        <CoverOptionsModal onClick={(e) => e.target === e.currentTarget && setShowCoverOptions(false)}>
          <CoverOptionsContent>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Choose Book Cover</h3>
              <CloseButton onClick={() => setShowCoverOptions(false)}>
                <X size={20} />
              </CloseButton>
            </div>
            
            {loadingCovers ? (
              <LoadingState>
                <Loader className="spinner" size={24} />
                <p>Loading cover options...</p>
              </LoadingState>
            ) : (
              <>
                <CoverGrid>
                  {coverOptions.map((cover, index) => (
                    <CoverOption
                      key={index}
                      $selected={selectedCover === cover}
                      onClick={() => setSelectedCover(cover)}
                    >
                      <img src={cover.url} alt="Book cover option" />
                      <div className="cover-info">
                        {cover.source} • {cover.quality}
                        {cover.validation?.size && (
                          <div>{Math.round(cover.validation.size / 1024)}KB</div>
                        )}
                      </div>
                    </CoverOption>
                  ))}
                </CoverGrid>
                
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <ActionButton 
                    className="secondary" 
                    onClick={() => setShowCoverOptions(false)}
                  >
                    Cancel
                  </ActionButton>
                  <ActionButton 
                    className="primary" 
                    onClick={handleSelectCover}
                    disabled={!selectedCover}
                  >
                    Use Selected Cover
                  </ActionButton>
                </div>
              </>
            )}
          </CoverOptionsContent>
        </CoverOptionsModal>
      )}
    </>
  );
};

export default BookSearchModal;