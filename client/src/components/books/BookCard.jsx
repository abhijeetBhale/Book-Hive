import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Book as BookIcon, User, Calendar, Tag, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import { getFullImageUrl } from '../../utils/imageHelpers';
import OptimizedImage from '../ui/OptimizedImage';

const BookCard = memo(({ book, onDelete }) => {
  const coverImageUrl = getFullImageUrl(book.coverImage);

  return (
    <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col group">
      <Link to={`/books/${book._id}`} className="block">
        <div className="relative h-64 overflow-hidden bg-gray-100">
          {book.isBooked && (
            <span className="absolute top-3 left-3 z-10 bg-red-600 text-white text-xs font-bold py-1 px-2 rounded-full shadow">
              Booked{book.bookedUntil ? ` · until ${new Date(book.bookedUntil).toLocaleDateString()}` : ''}
            </span>
          )}
          <OptimizedImage
            src={coverImageUrl}
            alt={book.title}
            fallbackSrc="https://placehold.co/300x450/e2e8f0/64748b?text=No+Cover"
            showQualityBadge={true}
            className="w-full h-full group-hover:scale-110 transition-transform duration-500"
            style={{ 
              filter: book.isBooked ? 'grayscale(0.3) brightness(0.8)' : 'none'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-4 left-4">
            <h3 className="text-2xl font-black text-white leading-tight shadow-md">{book.title}</h3>
          </div>
        </div>
      </Link>
      <div className="p-6 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex items-center text-gray-600 mb-4 text-base font-medium">
            <User className="inline-block mr-2 h-5 w-5 text-[#4F46E5]" />
            <span className="truncate">{book.author}</span>
          </div>
          <div className="flex items-center text-gray-600 mb-4 text-base font-medium">
            <Tag className="inline-block mr-2 h-5 w-5 text-[#F43F5E]" />
            <span>{book.category}</span>
          </div>
          {book.publicationYear && (
            <div className="flex items-center text-gray-600 mb-4 text-base font-medium">
              <Calendar className="inline-block mr-2 h-5 w-5 text-green-500" />
              <span>{book.publicationYear}</span>
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Link
            to={`/books/${book._id}`}
            className="w-full block text-center bg-gradient-to-r from-[#4F46E5]/10 to-purple-100 text-[#4F46E5] font-bold py-3 px-4 rounded-xl hover:from-[#4F46E5]/20 hover:to-purple-200 transition-all duration-300"
          >
            View Details
          </Link>
          {onDelete && (
            <Button
              onClick={onDelete}
              className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all duration-300"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

BookCard.displayName = 'BookCard';

export default BookCard;