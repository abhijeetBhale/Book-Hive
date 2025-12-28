import React, { memo, useContext } from 'react';
import { Link } from 'react-router-dom';
import { User, Calendar, Tag, Star, Wallet, Clock } from 'lucide-react';
import { getFullImageUrl } from '../../utils/imageHelpers';
import { formatRelativeTime } from '../../utils/dateHelpers';
import OptimizedImage from '../ui/OptimizedImage';
import VerifiedBadge from '../ui/VerifiedBadge';
import WishlistButton from './WishlistButton';
import { AuthContext } from '../../context/AuthContext';
import { usersAPI } from '../../utils/api';

const BookCard = memo(({ 
  book, 
  onDelete, 
  onView, 
  showWishlistButton = true, 
  isInWishlist = false,
  onWishlistChange 
}) => {
  const { user } = useContext(AuthContext);
  const coverImageUrl = getFullImageUrl(book.coverImage);
  const ownerAvatarUrl = book.owner?.avatar ? getFullImageUrl(book.owner.avatar) : null;

  const handleBookClick = async () => {
    // Add to recently viewed when user clicks on book
    if (user && onView) {
      try {
        await usersAPI.addToRecentlyViewed(book._id);
        onView();
      } catch (error) {
        console.error('Error adding to recently viewed:', error);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 flex flex-col">
      {/* Book Cover Image */}
      <Link to={`/books/${book._id}`} className="block" onClick={handleBookClick}>
        <div className="relative h-72 overflow-hidden bg-gray-100">
          {/* Status Badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
            {book.isBooked && (
              <span className="bg-red-600 text-white text-xs font-bold py-1 px-3 rounded-full shadow-lg">
                Booked
              </span>
            )}
            {!book.isAvailable && (
              <span className="bg-gray-600 text-white text-xs font-bold py-1 px-3 rounded-full shadow-lg">
                Unavailable
              </span>
            )}
            {book.forSelling && (
              <span className="bg-green-600 text-white text-xs font-bold py-1 px-3 rounded-full shadow-lg">
                For Sale
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          {showWishlistButton && user && book.owner?._id !== user._id && (
            <div className="absolute top-3 right-3 z-10">
              <WishlistButton
                bookId={book._id}
                isInWishlist={isInWishlist}
                onWishlistChange={onWishlistChange}
                size="md"
              />
            </div>
          )}

          <OptimizedImage
            src={coverImageUrl}
            alt={book.title}
            fallbackSrc="https://placehold.co/300x450/e2e8f0/64748b?text=No+Cover"
            showQualityBadge={false}
            className="w-full h-full object-cover"
            style={{ 
              filter: book.isBooked ? 'grayscale(0.3) brightness(0.8)' : 'none'
            }}
          />
          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4">
            <h3 className="text-xl font-bold text-white leading-tight line-clamp-2">
              {book.title}
            </h3>
          </div>
        </div>
      </Link>

      {/* Book Details */}
      <div className="p-4 flex-grow flex flex-col">
        {/* Author with Icon */}
        <div className="flex items-center gap-2 mb-3">
          <User className="h-5 w-5 text-indigo-600 flex-shrink-0" />
          <span className="text-gray-700 font-medium text-sm truncate">{book.author}</span>
          {/* Owner Avatar */}
          {book.owner && (
            <div className="ml-auto flex items-center gap-1.5">
              {ownerAvatarUrl ? (
                <img 
                  src={ownerAvatarUrl} 
                  alt={book.owner.name}
                  className="w-7 h-7 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold border-2 border-gray-200">
                  {book.owner.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-semibold text-gray-600 max-w-[80px] truncate flex items-center gap-1">
                {book.owner.name}
                {book.owner.isVerified && <VerifiedBadge size={12} />}
              </span>
            </div>
          )}
        </div>

        {/* Category with Icon */}
        <div className="flex items-center gap-2 mb-3">
          <Tag className="h-5 w-5 text-indigo-600 flex-shrink-0" />
          <span className="text-gray-600 text-sm">{book.category}</span>
        </div>

        {/* Publication Year with Icon */}
        {book.publicationYear && (
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-green-600 flex-shrink-0" />
            <span className="text-gray-600 text-sm">Expected: {book.publicationYear}</span>
          </div>
        )}

        {/* Rating (if available) */}
        {book.rating && book.rating.average > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-indigo-600 flex-shrink-0" />
            <span className="text-gray-600 text-sm">
              Rating: {book.rating.average.toFixed(1)}/5.0 
              {book.rating.count > 0 && ` (Based on ${book.rating.count} rating${book.rating.count !== 1 ? 's' : ''})`}
            </span>
          </div>
        )}

        {/* Lending Fee (if available) */}
        {book.forBorrowing && book.lendingFee > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-5 w-5 text-green-600 flex-shrink-0" />
            <span className="text-gray-600 text-sm font-semibold">
              Lending Fee: <span className="text-green-600">₹{book.lendingFee.toFixed(2)}</span>
            </span>
          </div>
        )}

        {/* Upload Time */}
        {book.createdAt && (
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <span className="text-gray-600 text-sm">
              Available {formatRelativeTime(book.createdAt)}
            </span>
          </div>
        )}

        {/* View Details Button */}
        <Link
          to={`/books/${book._id}`}
          onClick={handleBookClick}
          className={`mt-auto w-full block text-center font-semibold py-3 px-4 rounded-xl transition-all duration-200 ${
            book.isAvailable 
              ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' 
              : 'bg-gray-50 text-gray-500 cursor-not-allowed'
          }`}
        >
          {book.isAvailable ? 'View Details' : 'Currently Unavailable'}
        </Link>
      </div>
    </div>
  );
});

BookCard.displayName = 'BookCard';

export default BookCard;