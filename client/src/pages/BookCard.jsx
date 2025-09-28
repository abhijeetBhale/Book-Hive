import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { getFullImageUrl } from '../../utils/imageHelpers';
import { ArrowRight } from 'lucide-react';

const DetailsButton = styled(Link)`
  position: absolute;
  bottom: -50px; /* Start hidden below the card */
  left: 50%;
  transform: translateX(-50%);
  background-color: #4F46E5;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.875rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  opacity: 0;
  transition: all 0.3s ease-in-out;
  box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4);

  .arrow-icon {
    transition: transform 0.2s ease;
  }
`;

const ImageWrapper = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 0.75rem;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 50%);
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }
`;

const CardWrapper = styled.div`
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
    
    ${DetailsButton} {
      bottom: 20px;
      opacity: 1;
    }

    ${ImageWrapper}::after {
      opacity: 1;
    }

    ${DetailsButton} .arrow-icon {
      transform: translateX(4px);
    }
  }
`;

const BookCover = styled.img`
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  transition: transform 0.3s ease;
`;

const BookInfo = styled.div`
  padding: 1.25rem;
  text-align: center;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const BookTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem;
`;

const BookAuthor = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const BookCard = ({ book }) => {
  return (
    <CardWrapper>
      <ImageWrapper>
        <BookCover src={getFullImageUrl(book.coverImageUrl)} alt={`Cover of ${book.title}`} />
      </ImageWrapper>
      <BookInfo>
        <BookTitle>{book.title}</BookTitle>
        <BookAuthor>by {book.author}</BookAuthor>
      </BookInfo>
      {/* This link now correctly points to the new details page */}
      <DetailsButton to={`/books/${book._id}`}>
        View Details
        <ArrowRight size={16} className="arrow-icon" />
      </DetailsButton>
    </CardWrapper>
  );
};

export default BookCard;