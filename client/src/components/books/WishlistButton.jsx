import React, { useState, useContext } from 'react';
import { Heart } from 'lucide-react';
import { usersAPI } from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const WishlistButton = ({ bookId, isInWishlist: initialWishlistState, onWishlistChange, size = 'md' }) => {
  const { user } = useContext(AuthContext);
  const [isInWishlist, setIsInWishlist] = useState(initialWishlistState || false);
  const [isLoading, setIsLoading] = useState(false);

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please log in to add books to your wishlist');
      return;
    }

    setIsLoading(true);

    try {
      if (isInWishlist) {
        await usersAPI.removeFromWishlist(bookId);
        setIsInWishlist(false);
        toast.success('Removed from wishlist');
        onWishlistChange?.(bookId, false);
      } else {
        await usersAPI.addToWishlist(bookId);
        setIsInWishlist(true);
        toast.success('Added to wishlist');
        onWishlistChange?.(bookId, true);
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      const message = error.response?.data?.message || 'Failed to update wishlist';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-6 h-6 p-1',
    md: 'w-8 h-8 p-1.5',
    lg: 'w-10 h-10 p-2'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <button
      onClick={handleWishlistToggle}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        rounded-full transition-all duration-200 
        ${isInWishlist 
          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
        focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50
      `}
      title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart 
        size={iconSizes[size]} 
        className={`transition-colors duration-200 ${
          isInWishlist ? 'fill-current' : ''
        }`}
      />
    </button>
  );
};

export default WishlistButton;