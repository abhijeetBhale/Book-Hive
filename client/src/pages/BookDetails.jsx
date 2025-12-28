import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { booksAPI, borrowAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { getFullImageUrl } from '../utils/imageHelpers';
import { Loader, Shield, Wallet, Clock } from 'lucide-react';
import { formatRelativeTime } from '../utils/dateHelpers';
import OptimizedAvatar from '../components/OptimizedAvatar';
import UpgradeModal from '../components/ui/UpgradeModal';
import SEO from '../components/SEO';
import { BASE_URL, generateStructuredData } from '../utils/seo';
import toast from 'react-hot-toast';
import VerifiedBadge from '../components/ui/VerifiedBadge';

const PageWrapper = styled.div`
  background-color: #f9fafb;
  height: 100vh;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ContentWrapper = styled.div`
  max-width: 64rem;
  margin-top: -80px;
  width: 100%;
  height: 86vh;
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr;
  @media (min-width: 768px) {
    grid-template-columns: 300px 1fr;
  }
`;

const BookCoverImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const DetailsContainer = styled.div`
  padding: 1.5rem;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 900;
  color: #111827;
  line-height: 1.1;
  margin-bottom: 0.5rem;
`;

const Author = styled.p`
  font-size: 1.125rem;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 1rem;
`;

const Description = styled.div`
  font-size: 0.875rem;
  line-height: 1.5;
  color: #374151;
  margin-bottom: 1rem;
  max-height: 120px;
  overflow-y: auto;
  padding-right: 0.5rem;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

const OwnerSection = styled.div`
  margin-top: auto;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
`;

const OwnerTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.75rem;
`;

const OwnerCard = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border: 2px solid #e5e7eb;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  &:hover {
    background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
    border-color: #c7d2fe;
    box-shadow: 0 4px 6px rgba(79, 70, 229, 0.1);
    transform: translateY(-2px);
  }
`;

const OwnerName = styled.p`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
  background-color: #4F46E5;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 1rem;

  &:hover {
    background-color: #4338ca;
  }

  &:disabled {
    background-color: #a5b4fc;
    cursor: not-allowed;
  }
`;

const UploadTimeInfo = styled.div`
  margin-top: 0.75rem;
  padding: 0.5rem;
  background-color: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
`;

const BookDetails = () => {
  const { id } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upgradeModalData, setUpgradeModalData] = useState(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const response = await booksAPI.getById(id);
        setBook(response.data);
      } catch (err) {
        setError('Could not load book details.');
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  const handleBorrowRequest = async () => {
    try {
      const response = await borrowAPI.createRequest(id);
      toast.success(`📚 Borrow request sent for "${book?.title}"! You'll be notified when the owner responds.`, { 
        duration: 5000,
        icon: '✅'
      });
    } catch (err) {
      const errorData = err.response?.data;
      
      // Check if it's a borrow limit error
      if (errorData?.code === 'BORROW_LIMIT_REACHED') {
        setUpgradeModalData({
          currentLimit: errorData.currentLimit,
          activeBorrows: errorData.activeBorrows,
          isPremium: errorData.isPremium
        });
      } else {
        toast.error(`❌ ${errorData?.message || 'Failed to send borrow request.'}`, { duration: 4000 });
      }
    }
  };

  if (loading) {
    return (
      <LoadingContainer>
        <Loader size={48} className="animate-spin" />
      </LoadingContainer>
    );
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  if (!book) {
    return <p className="text-center">Book not found.</p>;
  }

  const isOwner = currentUser && currentUser.id === book.owner._id;

  // Generate dynamic SEO for book
  const bookSEO = {
    title: `${book.title} by ${book.author} | BookHive`,
    description: book.description || `Borrow ${book.title} by ${book.author} on BookHive. Connect with book lovers and discover your next read.`,
    keywords: `${book.title}, ${book.author}, ${book.genre || 'book'}, borrow book, book sharing`,
    image: getFullImageUrl(book.coverImage),
    url: `${BASE_URL}/books/${book._id}`,
    type: 'book'
  };

  // Generate structured data for the book
  const bookStructuredData = generateStructuredData('Book', {
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    description: book.description,
    image: getFullImageUrl(book.coverImage),
    genre: book.genre
  });

  return (
    <>
      <SEO 
        title={bookSEO.title}
        description={bookSEO.description}
        keywords={bookSEO.keywords}
        image={bookSEO.image}
        url={bookSEO.url}
        type={bookSEO.type}
        structuredData={bookStructuredData}
        breadcrumbs={[
          { name: 'Home', url: BASE_URL },
          { name: 'Books', url: `${BASE_URL}/books` },
          { name: book.title, url: `${BASE_URL}/books/${book._id}` }
        ]}
      />
      <UpgradeModal
        isOpen={!!upgradeModalData}
        onClose={() => setUpgradeModalData(null)}
        currentLimit={upgradeModalData?.currentLimit}
        activeBorrows={upgradeModalData?.activeBorrows}
        isPremium={upgradeModalData?.isPremium}
      />
      
      <PageWrapper>
        <ContentWrapper>
          <BookCoverImage src={getFullImageUrl(book.coverImage)} alt={`Cover of ${book.title}`} />
          <DetailsContainer>
            <Title>{book.title}</Title>
            <Author>by {book.author}</Author>
            <Description>{book.description || 'No description available.'}</Description>

            {book.securityDeposit > 0 && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.5rem',
                backgroundColor: '#eff6ff',
                borderRadius: '0.5rem',
                border: '1px solid #bfdbfe',
                color: '#1e40af',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem'
              }}>
                <Shield size={16} />
                <span style={{ fontWeight: 600 }}>
                  Security Deposit: ₹{book.securityDeposit}
                </span>
              </div>
            )}

            {book.lendingFee > 0 && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.5rem',
                backgroundColor: '#ecfdf5',
                borderRadius: '0.5rem',
                border: '1px solid #a7f3d0',
                color: '#065f46',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem'
              }}>
                <Wallet size={16} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 600 }}>
                    Lending Fee: ₹{book.lendingFee.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#047857' }}>
                    A small fee to support the book sharing community
                  </span>
                </div>
              </div>
            )}

            {!isOwner && (
              <>
                <UploadTimeInfo>
                  <Clock size={14} />
                  <span>
                    Available for {formatRelativeTime(book.createdAt)}
                  </span>
                </UploadTimeInfo>
                
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  {book.forBorrowing && (
                    <ActionButton onClick={handleBorrowRequest}>
                      Request to Borrow
                    </ActionButton>
                  )}
                  {book.forSelling && (
                    <ActionButton
                      onClick={() => alert('Contact seller functionality coming soon!')}
                      style={{
                        flex: book.forBorrowing ? 1 : 'auto',
                        backgroundColor: '#059669',
                      }}
                    >
                      Buy for ₹{book.sellingPrice?.toFixed(2) || '0.00'}
                    </ActionButton>
                  )}
                </div>
              </>
            )}

            <OwnerSection>
              <OwnerTitle>Book Owner</OwnerTitle>
              <OwnerCard to={`/profile/${book.owner._id}`}>
                <OptimizedAvatar
                  src={book.owner.avatar}
                  alt={book.owner.name}
                  size={40}
                />
                <OwnerName>
                  {book.owner.name}
                  {book.owner.isVerified && <VerifiedBadge size={14} />}
                </OwnerName>
              </OwnerCard>
            </OwnerSection>
          </DetailsContainer>
        </ContentWrapper>
      </PageWrapper>
    </>
  );
};

export default BookDetails;