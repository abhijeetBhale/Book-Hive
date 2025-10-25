import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { booksAPI, borrowAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { getFullImageUrl } from '../utils/imageHelpers';
import { Loader, BookOpen, User, ArrowRight } from 'lucide-react';

const PageWrapper = styled.div`
  background-color: #f9fafb;
  min-height: 100vh;
  padding: 4rem 1rem;
`;

const ContentWrapper = styled.div`
  max-width: 64rem;
  margin: 0 auto;
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
  padding: 2.5rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 900;
  color: #111827;
  line-height: 1.1;
  margin-bottom: 0.5rem;
`;

const Author = styled.p`
  font-size: 1.25rem;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 2rem;
`;

const Description = styled.p`
  font-size: 1rem;
  line-height: 1.625;
  color: #374151;
  margin-bottom: 2rem;
`;

const InfoTag = styled.span`
  display: inline-block;
  background-color: #eef2ff;
  color: #4338ca;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.875rem;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
`;

const OwnerSection = styled.div`
  margin-top: 2.5rem;
  padding-top: 2.5rem;
  border-top: 1px solid #e5e7eb;
`;

const OwnerTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1rem;
`;

const OwnerCard = styled(Link)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  background-color: #f9fafb;
  text-decoration: none;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f3f4f6;
  }
`;

const Avatar = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
`;

const AvatarPlaceholder = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1.25rem;
`;

const OwnerName = styled.p`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 700;
  color: white;
  background-color: #4F46E5;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 2rem;

  &:hover {
    background-color: #4338ca;
  }

  &:disabled {
    background-color: #a5b4fc;
    cursor: not-allowed;
  }
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

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const response = await booksAPI.getById(id);
        setBook(response.data);
      } catch (err) {
        setError('Could not load book details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  const handleBorrowRequest = async () => {
    try {
      await borrowAPI.createRequest(id);
      alert('Borrow request sent successfully!');
      // You might want to update the UI to reflect this
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send borrow request.');
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

  return (
    <PageWrapper>
      <ContentWrapper>
        <BookCoverImage src={getFullImageUrl(book.coverImage)} alt={`Cover of ${book.title}`} />
        <DetailsContainer>
          <Title>{book.title}</Title>
          <Author>by {book.author}</Author>
          <Description>{book.description || 'No description available.'}</Description>
          <div>
            <InfoTag>Category: {book.category}</InfoTag>
            <InfoTag>Condition: {book.condition}</InfoTag>
            <InfoTag>Publication Year: {book.publicationYear || 'Unknown'}</InfoTag>
            <InfoTag>Status: {book.isAvailable ? 'Available' : 'Not Available'}</InfoTag>
            {book.forBorrowing && (
              <InfoTag style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                Lending Duration: {book.lendingDuration || 14} days
              </InfoTag>
            )}
            {book.forSelling && (
              <InfoTag style={{ backgroundColor: '#d1fae5', color: '#059669' }}>
                For Sale: ₹{book.sellingPrice?.toFixed(2) || '0.00'}
              </InfoTag>
            )}
          </div>

          <OwnerSection>
            <OwnerTitle>Listed By</OwnerTitle>
            <OwnerCard to={`/users/${book.owner._id}`}>
              {book.owner.avatar ? (
                <Avatar 
                  src={getFullImageUrl(book.owner.avatar)} 
                  alt={book.owner.name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <AvatarPlaceholder style={{ display: book.owner.avatar ? 'none' : 'flex' }}>
                {book.owner.name ? book.owner.name.charAt(0).toUpperCase() : 'U'}
              </AvatarPlaceholder>
              <OwnerName>{book.owner.name}</OwnerName>
            </OwnerCard>
          </OwnerSection>

          {!isOwner && book.isAvailable && (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              {book.forBorrowing && (
                <ActionButton onClick={handleBorrowRequest} style={{ flex: book.forSelling ? 1 : 'auto' }}>
                  Request to Borrow ({book.lendingDuration || 14} days)
                </ActionButton>
              )}
              {book.forSelling && (
                <ActionButton 
                  onClick={() => alert('Contact seller functionality coming soon!')} 
                  style={{ 
                    flex: book.forBorrowing ? 1 : 'auto',
                    backgroundColor: '#059669',
                    '&:hover': { backgroundColor: '#047857' }
                  }}
                >
                  Buy for ₹{book.sellingPrice?.toFixed(2) || '0.00'}
                </ActionButton>
              )}
            </div>
          )}
        </DetailsContainer>
      </ContentWrapper>
    </PageWrapper>
  );
};

export default BookDetails;