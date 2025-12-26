import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import { booksAPI, usersAPI } from '../utils/api';
import BookCard from '../components/books/BookCard';
import { Loader, Heart, Clock } from 'lucide-react';
import EnhancedSearchFilters from '../components/books/EnhancedSearchFilters';
import toast from 'react-hot-toast';
import { getFullImageUrl, preloadImages } from '../utils/imageHelpers';
import SEO from '../components/SEO';
import { PAGE_SEO } from '../utils/seo';
import { AuthContext } from '../context/AuthContext';

// --- STYLED COMPONENTS ---
const PageWrapper = styled.div`
  background-color: #f8fafc;
  min-height: 100vh;
`;

const HeaderSection = styled.header`
  padding: 3rem 1rem 2rem;
  text-align: center;
  background: linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%);
  
  @media (max-width: 768px) {
    padding: 2rem 1rem 1.5rem;
  }
`;

const Title = styled.h1`
  font-size: 3.5rem;
  font-weight: 900;
  color: #111827;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 2rem;
  }
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
`;

const BookGridContainer = styled.div`
  width: 100%;
`;

const BookGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
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

const TabNavigation = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  
  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;

const TabButton = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  background-color: ${props => props.$active ? '#3b82f6' : 'white'};
  color: ${props => props.$active ? 'white' : '#374151'};
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  @media (max-width: 480px) {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }
`;

// --- MAIN COMPONENT ---
const Books = () => {
    const { user } = useContext(AuthContext);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({});
    const [activeTab, setActiveTab] = useState('all');
    const [recommendations, setRecommendations] = useState([]);
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [wishlist, setWishlist] = useState([]);

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
        maxDistance: 10
    });

    // Fetch data on component mount and when filters change
    useEffect(() => {
        fetchBooks();
        if (user) {
            fetchRecommendations();
            fetchRecentlyViewed();
            fetchWishlist();
        }
    }, [filters, activeTab, user]);

    // Add book to recently viewed when user views a book
    const addToRecentlyViewed = async (bookId) => {
        if (user) {
            try {
                await usersAPI.addToRecentlyViewed(bookId);
                fetchRecentlyViewed(); // Refresh recently viewed
            } catch (error) {
                console.error('Error adding to recently viewed:', error);
            }
        }
    };

    const fetchBooks = async () => {
        try {
            setLoading(true);
            let response;
            
            if (activeTab === 'recommendations' && user) {
                response = await booksAPI.getRecommendations({ limit: 20 });
                setBooks(response.recommendations || []);
                setPagination({ total: response.count || 0, page: 1, pages: 1 });
            } else {
                // Apply location if user is logged in and useLocation is enabled
                const searchParams = { ...filters };
                if (user && filters.useLocation && user.location?.coordinates) {
                    searchParams.latitude = user.location.coordinates[1];
                    searchParams.longitude = user.location.coordinates[0];
                    searchParams.maxDistance = filters.maxDistance * 1000; // Convert km to meters
                }

                response = await booksAPI.getAll(searchParams);
                const fetchedBooks = response.data.books || [];
                
                setBooks(fetchedBooks);
                setPagination(response.data.pagination || {});
            }
            
            setError(null);
            setLoading(false);
            
            // Preload book cover images in the background for better performance
            const imageUrls = books
              .map(book => getFullImageUrl(book.coverImage))
              .filter(url => url && !url.includes('placehold.co'));
            
            if (imageUrls.length > 0) {
              setTimeout(() => {
                preloadImages(imageUrls).catch(() => {
                  // Image preload completed with some errors (non-critical)
                });
              }, 100);
            }
        } catch (err) {
            setError('Failed to load books. Please try again later.');
            setLoading(false);
        }
    };

    const fetchRecommendations = async () => {
        try {
            const response = await booksAPI.getRecommendations({ limit: 10 });
            setRecommendations(response.recommendations || []);
        } catch (error) {
            console.error('Error fetching recommendations:', error);
        }
    };

    const fetchRecentlyViewed = async () => {
        try {
            const response = await usersAPI.getRecentlyViewed({ limit: 10 });
            setRecentlyViewed(response.recentlyViewed || []);
        } catch (error) {
            console.error('Error fetching recently viewed:', error);
        }
    };

    const fetchWishlist = async () => {
        try {
            const response = await usersAPI.getWishlist({ limit: 50 });
            setWishlist(response.wishlist || []);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        }
    };

    const handleFiltersChange = (newFilters) => {
        setFilters(newFilters);
    };

    const clearAllFilters = () => {
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



    return (
        <>
            <SEO 
                title={PAGE_SEO.books.title}
                description={PAGE_SEO.books.description}
                keywords={PAGE_SEO.books.keywords}
                url={PAGE_SEO.books.url}
            />
            <PageWrapper>
                <HeaderSection>
                    <Title>Discover Your Next Great Read</Title>
                <Subtitle>
                    Explore thousands of books from our community. Find personalized recommendations, browse by category, or search for something specific.
                </Subtitle>
                
                {/* Tab Navigation */}
                {user && (
                    <TabNavigation>
                        <TabButton
                            $active={activeTab === 'all'}
                            onClick={() => setActiveTab('all')}
                        >
                            All Books
                        </TabButton>
                        <TabButton
                            $active={activeTab === 'recommendations'}
                            onClick={() => setActiveTab('recommendations')}
                        >
                            <Heart size={16} />
                            For You
                        </TabButton>
                        {recentlyViewed.length > 0 && (
                            <TabButton
                                $active={activeTab === 'recent'}
                                onClick={() => setActiveTab('recent')}
                            >
                                <Clock size={16} />
                                Recently Viewed
                            </TabButton>
                        )}
                    </TabNavigation>
                )}
            </HeaderSection>
            
            <MainContent>
                {/* Enhanced Search Filters */}
                {activeTab === 'all' && (
                    <div style={{ marginBottom: '2rem' }}>
                        <EnhancedSearchFilters 
                            onFiltersChange={handleFiltersChange}
                            initialFilters={filters}
                        />
                    </div>
                )}
                
                <BookGridContainer>
                    {loading ? (
                        <LoadingContainer>
                            <Loader size={48} color="#4F46E5" className="animate-spin" />
                        </LoadingContainer>
                    ) : error ? (
                        <ErrorMessage>{error}</ErrorMessage>
                    ) : (
                        <>
                            {/* Tab Content Headers */}
                            {activeTab === 'recommendations' && (
                                <div style={{ 
                                    padding: '1rem', 
                                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
                                    borderRadius: '8px', 
                                    marginBottom: '1rem',
                                    border: '1px solid #f59e0b'
                                }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>
                                        📚 Personalized Recommendations
                                    </h3>
                                    <p style={{ fontSize: '0.875rem', color: '#b45309' }}>
                                        Based on your reading preferences and activity
                                    </p>
                                </div>
                            )}

                            {activeTab === 'recent' && (
                                <div style={{ 
                                    padding: '1rem', 
                                    background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', 
                                    borderRadius: '8px', 
                                    marginBottom: '1rem',
                                    border: '1px solid #6366f1'
                                }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#3730a3', marginBottom: '0.5rem' }}>
                                        🕒 Recently Viewed Books
                                    </h3>
                                    <p style={{ fontSize: '0.875rem', color: '#4338ca' }}>
                                        Continue exploring books you've looked at before
                                    </p>
                                </div>
                            )}

                            {/* Results Summary */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between', 
                                marginBottom: '1rem',
                                flexWrap: 'wrap',
                                gap: '0.5rem'
                            }}>
                                <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
                                    {books.length} {books.length === 1 ? 'book' : 'books'} 
                                    {activeTab === 'all' && ' found'}
                                    {activeTab === 'recommendations' && ' recommended for you'}
                                    {activeTab === 'recent' && ' recently viewed'}
                                </span>
                                
                                {activeTab === 'all' && (filters.search || filters.category || filters.condition) && (
                                    <button
                                        onClick={clearAllFilters}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#3b82f6',
                                            fontSize: '0.875rem',
                                            cursor: 'pointer',
                                            textDecoration: 'underline',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Clear all filters
                                    </button>
                                )}
                            </div>

                            {/* Empty States */}
                            {books.length === 0 && !loading && (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '3rem 1rem',
                                    color: '#6b7280'
                                }}>
                                    {activeTab === 'all' && (
                                        <>
                                            <p style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                                No books found
                                            </p>
                                            <p style={{ fontSize: '0.875rem' }}>
                                                Try adjusting your search or filters
                                            </p>
                                        </>
                                    )}
                                    {activeTab === 'recommendations' && (
                                        <>
                                            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <p style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                                No recommendations yet
                                            </p>
                                            <p style={{ fontSize: '0.875rem' }}>
                                                Set your reading preferences to get personalized recommendations
                                            </p>
                                        </>
                                    )}
                                    {activeTab === 'recent' && (
                                        <>
                                            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <p style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                                No recently viewed books
                                            </p>
                                            <p style={{ fontSize: '0.875rem' }}>
                                                Start browsing books to see them here
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Books Grid */}
                            <BookGrid>
                                {(activeTab === 'recent' ? recentlyViewed.map(item => item.book) : books)
                                    .filter(book => book) // Filter out null books
                                    .map((book) => (
                                    <BookCard 
                                        key={book._id} 
                                        book={book} 
                                        onView={() => addToRecentlyViewed(book._id)}
                                        showWishlistButton={true}
                                        isInWishlist={wishlist.some(w => w._id === book._id)}
                                    />
                                ))}
                            </BookGrid>

                            {/* Pagination */}
                            {pagination && pagination.pages > 1 && activeTab === 'all' && (
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
            </PageWrapper>
        </>
    );
};

export default Books;