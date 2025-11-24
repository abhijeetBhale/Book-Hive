import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { usersAPI, booksAPI, borrowAPI, notificationsAPI, friendsAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Loader, MapPin, BookOpen, Send, X, User as UserIcon, Star } from 'lucide-react';
import { getFullImageUrl } from '../utils/imageHelpers';
import ReviewsModal from '../components/ReviewsModal';
import VerifiedBadge from '../components/ui/VerifiedBadge';
import AnimatedButton from '../components/ui/AnimatedButton';
import UpgradeModal from '../components/ui/UpgradeModal';


// --- Keyframes for Animations ---
const fadeIn = keyframes` from { opacity: 0; } to { opacity: 1; } `;
const slideIn = keyframes` from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } `;

// --- ROBUST AVATAR IMAGE COMPONENT ---
const AvatarImage = ({ src, alt }) => {
  const [imgSrc, setImgSrc] = useState(src);
  useEffect(() => { setImgSrc(src); }, [src]);
  const handleError = () => { setImgSrc('/placeholder-avatar.png'); };
  return <img src={imgSrc} alt={alt} onError={handleError} />;
};


// --- BOOK DETAILS MODAL COMPONENT ---
const StyledBookDetailsModal = styled.div`
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  background-color: rgba(17, 24, 39, 0.6);
  backdrop-filter: blur(4px);
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
  
  @media (max-width: 480px) {
    padding: 0.5rem;
  }

  .modal-content {
    background-color: white; border-radius: 1rem;
    width: 100%; max-width: 800px;
    position: relative; max-height: 90vh;
    overflow-y: auto; display: flex;
    flex-direction: column;
    animation: ${slideIn} 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
    
    @media (min-width: 768px) { 
      flex-direction: row; 
    }
    
    @media (max-width: 480px) {
      border-radius: 0.75rem;
      max-height: 95vh;
    }
  }

  .close-btn {
    position: absolute; top: 0.75rem; right: 0.75rem;
    padding: 0.5rem; border-radius: 9999px; cursor: pointer;
    background-color: #f3f4f6; border: none;
    &:hover { background-color: #e5e7eb; }
    z-index: 10;
  }
  
  .image-pane {
    flex-shrink: 0; width: 100%; aspect-ratio: 2 / 3;
    @media (min-width: 768px) { width: 300px; aspect-ratio: auto; }
    img {
      width: 100%; height: 100%; object-fit: cover;
      border-radius: 1rem 1rem 0 0;
      @media (min-width: 768px) { border-radius: 1rem 0 0 1rem; }
    }
  }
  
  .details-pane { 
    padding: 2rem 1.5rem; 
    display: flex; 
    flex-direction: column; 
    flex-grow: 1;
    
    @media (max-width: 768px) {
      padding: 1.5rem 1.25rem;
    }
    
    @media (max-width: 480px) {
      padding: 1.25rem 1rem;
    }
  }
  
  .book-title { 
    font-size: 1.75rem; 
    font-weight: 800; 
    color: #111827; 
    line-height: 1.2;
    
    @media (max-width: 768px) {
      font-size: 1.5rem;
    }
    
    @media (max-width: 480px) {
      font-size: 1.375rem;
    }
  }
  
  .book-author { 
    font-size: 1rem; 
    color: #4b5563; 
    margin-top: 0.25rem; 
    margin-bottom: 1rem;
    
    @media (max-width: 480px) {
      font-size: 0.9375rem;
    }
  }
  
  .status-badge {
    padding: 0.2rem 0.6rem; font-size: 0.75rem; font-weight: 600;
    border-radius: 9999px; text-transform: capitalize; align-self: flex-start;
    &.available { background-color: #dcfce7; color: #166534; }
    &.borrowed { background-color: #dbeafe; color: #1e40af; }
    margin-bottom: 1rem;
  }
  
  .details-grid {
    display: grid; 
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem; 
    margin-bottom: 1rem; 
    font-size: 0.9rem;
    
    @media (max-width: 480px) {
      grid-template-columns: 1fr;
      gap: 0.625rem;
      font-size: 0.875rem;
    }
    
    div {
      span:first-child { 
        font-weight: 600; 
        color: #1f2937; 
        display: block;
        
        @media (max-width: 480px) {
          font-size: 0.8125rem;
        }
      }
      span:last-child { 
        color: #4b5563;
        
        @media (max-width: 480px) {
          font-size: 0.8125rem;
        }
      }
    }
  }

  .description {
    margin-top: 1rem;
    h4 { font-weight: 700; color: #111827; margin-bottom: 0.5rem; }
    p { font-size: 0.9rem; color: #4b5563; line-height: 1.6; max-height: 150px; overflow-y: auto; }
  }
  
  .modal-footer { margin-top: auto; padding-top: 1.5rem; }
  
  .request-btn {
    width: 100%; 
    display: inline-flex; 
    align-items: center; 
    justify-content: center;
    gap: 0.5rem; 
    background-color: #4F46E5; 
    color: white; 
    font-size: 1rem; 
    font-weight: 600;
    padding: 0.75rem 1.5rem; 
    border: none; 
    border-radius: 0.5rem; 
    cursor: pointer;
    transition: background-color 0.2s;
    
    @media (max-width: 480px) {
      font-size: 0.9375rem;
      padding: 0.625rem 1.25rem;
      gap: 0.375rem;
      
      svg {
        width: 16px;
        height: 16px;
      }
    }
    
    &:hover:not(:disabled) { background-color: #4338ca; }
    &:disabled { background-color: #9ca3af; cursor: not-allowed; }
  }
`;

const BookDetailsModal = ({ isOpen, onClose, book, onRequest }) => {
  if (!isOpen || !book) return null;

  return (
    <StyledBookDetailsModal onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="close-btn"><X size={20} /></button>
        <div className="image-pane">
          <img src={getFullImageUrl(book.coverImage)} alt={`Cover of ${book.title}`} />
        </div>
        <div className="details-pane">
          <h2 className="book-title">{book.title}</h2>
          <p className="book-author">by {book.author}</p>
          <span className={`status-badge ${book.isAvailable && book.forBorrowing ? 'available' : 'borrowed'}`}>
            {book.isAvailable && book.forBorrowing ? 'Available for Borrowing' : 'Currently Unavailable'}
          </span>

          <div className="details-grid">
            <div><span>Category</span><span>{book.category}</span></div>
            <div><span>Condition</span><span>{book.condition}</span></div>
            <div><span>Published</span><span>{book.publicationYear || 'N/A'}</span></div>
            <div><span>ISBN</span><span>{book.isbn || 'N/A'}</span></div>
            {book.forBorrowing && (
              <div><span>Lending Duration</span><span>{book.lendingDuration || 14} days</span></div>
            )}
            {book.forSelling && (
              <div><span>Price</span><span>₹{book.sellingPrice?.toFixed(2) || '0.00'}</span></div>
            )}
          </div>

          <div className="description">
            <h4>Description</h4>
            <p>{book.description}</p>
          </div>

          <div className="modal-footer">
            {book.isAvailable && (book.forBorrowing || book.forSelling) ? (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {book.forBorrowing && (
                  <button
                    className="request-btn"
                    onClick={() => onRequest(book._id)}
                    style={{ flex: book.forSelling ? 1 : 'auto' }}
                  >
                    <Send size={18} />
                    Borrow ({book.lendingDuration || 14} days)
                  </button>
                )}
                {book.forSelling && (
                  <button
                    className="request-btn"
                    onClick={() => toast.info('Contact seller functionality coming soon!')}
                    style={{ 
                      flex: book.forBorrowing ? 1 : 'auto',
                      backgroundColor: '#059669'
                    }}
                  >
                    <Send size={18} />
                    Buy for ₹{book.sellingPrice?.toFixed(2) || '0.00'}
                  </button>
                )}
              </div>
            ) : (
              <button className="request-btn" disabled>
                <Send size={18} />
                Currently Unavailable
              </button>
            )}
          </div>
        </div>
      </div>
    </StyledBookDetailsModal>
  );
};


// --- BOOK CARD COMPONENT ---
const StyledBookCard = styled.div`
  background-color: white; 
  border: 1px solid #e5e7eb; 
  border-radius: 1rem;
  overflow: hidden; 
  display: flex; 
  flex-direction: column;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  @media (max-width: 480px) {
    border-radius: 0.75rem;
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.07);
  }
  
  .book-cover { 
    width: 100%; 
    aspect-ratio: 2 / 3; 
    object-fit: cover;
    cursor: pointer;
  }
  
  .card-content { 
    padding: 1rem; 
    display: flex; 
    flex-direction: column; 
    flex-grow: 1;
    
    @media (max-width: 480px) {
      padding: 0.75rem;
    }
  }
  
  .book-title { 
    font-size: 1.125rem; 
    font-weight: 700; 
    color: #111827;
    line-height: 1.3;
    cursor: pointer;
    
    @media (max-width: 768px) {
      font-size: 1rem;
    }
    
    @media (max-width: 480px) {
      font-size: 0.9375rem;
    }
  }
  
  .book-author { 
    font-size: 0.875rem; 
    color: #6b7280; 
    margin-top: 0.25rem; 
    margin-bottom: 0.75rem;
    cursor: pointer;
    
    @media (max-width: 480px) {
      font-size: 0.8125rem;
      margin-bottom: 0.625rem;
    }
  }
  
  .book-action-section {
    margin-top: auto;
    width: 100%;
    
    @media (max-width: 480px) {
      margin-top: 0.5rem;
    }
  }
`;

const BookCard = ({ book, onClick }) => {
  // Determine button text and variant based on book status
  const getButtonConfig = () => {
    if (!book.isAvailable) {
      return {
        text: 'Currently Borrowed',
        variant: 'borrowed',
        disabled: true
      };
    }
    if (book.forBorrowing && book.forSelling) {
      return {
        text: 'Borrow or Buy',
        variant: 'available',
        disabled: false
      };
    }
    if (book.forBorrowing) {
      return {
        text: 'Available to Borrow',
        variant: 'available',
        disabled: false
      };
    }
    if (book.forSelling) {
      return {
        text: 'Available to Buy',
        variant: 'available',
        disabled: false
      };
    }
    return {
      text: 'Not Available',
      variant: 'unavailable',
      disabled: true
    };
  };

  const buttonConfig = getButtonConfig();

  const handleButtonClick = (e) => {
    e.stopPropagation(); // Prevent card click event
    onClick(book);
  };

  return (
    <StyledBookCard>
      <div style={{ position: 'relative' }} onClick={() => onClick(book)}>
        <img src={getFullImageUrl(book.coverImage)} alt={book.title} className="book-cover" />
        
        {/* Availability Badges */}
        <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {book.forBorrowing && (
            <div style={{ 
              backgroundColor: '#3B82F6', 
              color: 'white', 
              padding: '0.25rem 0.5rem', 
              borderRadius: '0.375rem', 
              fontSize: '0.75rem', 
              fontWeight: '600' 
            }}>
              {book.lendingDuration || 14}d
            </div>
          )}
          {book.forSelling && (
            <div style={{ 
              backgroundColor: '#10B981', 
              color: 'white', 
              padding: '0.25rem 0.5rem', 
              borderRadius: '0.375rem', 
              fontSize: '0.75rem', 
              fontWeight: '600' 
            }}>
              ₹{book.sellingPrice?.toFixed(2) || '0.00'}
            </div>
          )}
        </div>
      </div>
      
      <div className="card-content">
        <h3 className="book-title" onClick={() => onClick(book)}>{book.title}</h3>
        <p className="book-author" onClick={() => onClick(book)}>by {book.author}</p>
        
        <div className="book-action-section">
          <AnimatedButton 
            text={buttonConfig.text}
            variant={buttonConfig.variant}
            disabled={buttonConfig.disabled}
            onClick={handleButtonClick}
          />
        </div>
      </div>
    </StyledBookCard>
  );
};


// --- MESSAGE MODAL COMPONENT ---
const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(17, 24, 39, 0.6);
  backdrop-filter: blur(4px);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000; animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContent = styled.div`
  background: white; border-radius: 1rem; width: 90%; max-width: 600px;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
  animation: ${slideIn} 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  display: flex; flex-direction: column;
  
  .modal-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 1rem 1.5rem; border-bottom: 1px solid #e5e7eb;
    h3 { font-size: 1.125rem; font-weight: 600; color: #111827; }
    .close-btn {
        background: none; border: none; color: #9ca3af; cursor: pointer;
        &:hover { color: #111827; }
    }
  }

  .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
  
  .input-row {
    display: flex; align-items: center; gap: 1rem;
    border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem;
    label { font-weight: 500; color: #6b7280; }
    .recipient-tag {
      display: inline-flex; align-items: center; gap: 0.5rem;
      background-color: #f3f4f6; padding: 0.25rem 0.75rem;
      border-radius: 0.5rem; font-weight: 500;
    }
    input {
      flex-grow: 1; border: none; padding: 0.5rem 0;
      font-size: 1rem; &:focus { outline: none; }
    }
  }

  textarea {
      width: 100%; min-height: 200px; border: none;
      padding: 1rem 0; font-size: 1rem; resize: vertical;
      &:focus { outline: none; }
  }

  .modal-footer {
    display: flex; justify-content: flex-end; align-items: center;
    gap: 0.75rem; padding: 1rem 1.5rem; background-color: #f9fafb;
    border-top: 1px solid #e5e7eb;
    .cancel-btn {
        background-color: white; color: #374151; border: 1px solid #d1d5db;
        font-size: 1rem; font-weight: 600; padding: 0.6rem 1.25rem;
        border-radius: 0.5rem; cursor: pointer; transition: background-color 0.2s;
        &:hover { background-color: #f3f4f6; }
    }
    .send-btn {
        display: inline-flex; align-items: center; gap: 0.5rem; background-color: #4F46E5;
        color: white; font-size: 1rem; font-weight: 600; padding: 0.6rem 1.25rem;
        border: none; border-radius: 0.5rem; cursor: pointer;
        transition: background-color 0.2s;
        &:hover:not(:disabled) { background-color: #4338ca; }
        &:disabled { background-color: #a5b4fc; cursor: not-allowed; }
    }
  }
`;

const MessageModal = ({ user, onClose }) => {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setIsSending(true);
    try {
      // Send as book inquiry notification (not chat message)
      await notificationsAPI.createBookInquiry({
        toUserId: user._id,
        subject: subject || 'Book Inquiry',
        body: message,
      });
      toast.success(`Book inquiry sent to ${user.name}! They will see it in their notifications.`);
      onClose();
    } catch (error) {
      console.error('Failed to send book inquiry:', error);
      toast.error("Failed to send book inquiry. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Send Book Inquiry</h3>
          <button onClick={onClose} className="close-btn"><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="input-row">
            <label>To</label>
            <span className="recipient-tag">
              <UserIcon size={16} /> {user.name}
            </span>
          </div>
          <div className="input-row">
            <label>RE:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Book Inquiry"
            />
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Ask ${user.name} about their books, availability, or arrange a meetup...`}
          />
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Discard</button>
          <button className="send-btn" onClick={handleSend} disabled={isSending}>
            {isSending ? <Loader className="animate-spin" size={20} /> : <Send size={18} />}
            <span>{isSending ? 'Sending Inquiry...' : 'Send Inquiry'}</span>
          </button>
        </div>
      </ModalContent>
    </ModalOverlay>
  );
};


// --- MAIN USER PROFILE COMPONENT ---
const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(null);
  const [isMessageModalOpen, setMessageModalOpen] = useState(false);
  const [viewingBook, setViewingBook] = useState(null);
  const [friendshipStatus, setFriendshipStatus] = useState(null); // null, 'pending', 'sent', 'friends'
  const [friendshipId, setFriendshipId] = useState(null);
  const [sendingFriendRequest, setSendingFriendRequest] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [upgradeModalData, setUpgradeModalData] = useState(null);


  // ✨ ADDED: Effect to lock body scroll when a modal is open
  useEffect(() => {
    const isModalOpen = isMessageModalOpen || !!viewingBook;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMessageModalOpen, viewingBook]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const userResponse = await usersAPI.getUserProfile(id);
      if (!userResponse.data || !userResponse.data.user) throw new Error('User not found');
      const userData = userResponse.data.user;

      const booksResponse = await booksAPI.getUserBooks(id);
      userData.booksOwned = booksResponse.data.books || [];

      setUser(userData);

      // Check friendship status
      if (currentUser && id !== currentUser._id) {
        try {
          const friendsResponse = await friendsAPI.getAll();
          const { pending, sent, friends } = friendsResponse.data;

            // Check if there's a pending request from this user to current user
            const pendingRequest = pending.find(req => req.requester._id === id);
            if (pendingRequest) {
              setFriendshipStatus('pending');
              setFriendshipId(pendingRequest._id);
              return;
            }

            // Check if current user sent a request to this user
            const sentRequest = sent.find(req => req.recipient._id === id);
            if (sentRequest) {
              setFriendshipStatus('sent');
              setFriendshipId(sentRequest._id);
              return;
            }

            // Check if they are already friends
            const friendship = friends.find(f =>
              (f.requester._id === id) || (f.recipient._id === id)
            );
            if (friendship) {
              setFriendshipStatus('friends');
              setFriendshipId(friendship._id);
              return;
            }

            // No relationship exists
            setFriendshipStatus(null);
            setFriendshipId(null);
          } catch (error) {
            console.error('Error checking friendship status:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast.error("Could not fetch user profile.");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (id) fetchUserProfile();
  }, [id, currentUser]);

  // Listen for review updates to refresh profile data
  useEffect(() => {
    const handleReviewUpdate = (event) => {
      if (event.detail?.userId === id) {
        // Refresh user profile to get updated review count and star level
        fetchUserProfile();
      }
    };

    window.addEventListener('review-updated', handleReviewUpdate);
    return () => window.removeEventListener('review-updated', handleReviewUpdate);
  }, [id]);

  const handleOpenDetailsModal = (book) => setViewingBook(book);
  const handleCloseDetailsModal = () => setViewingBook(null);

  const handleBorrowRequest = async (bookId) => {
    if (!currentUser) {
      toast.error('Please log in to borrow books.');
      return;
    }
    setBorrowing(bookId);
    try {
      await borrowAPI.createRequest(bookId);
      const book = user.booksOwned?.find(b => b._id === bookId);
      toast.success(`📚 Borrow request sent for "${book?.title || 'this book'}"!`, { duration: 5000 });
      handleCloseDetailsModal();
    } catch (error) {
      const errorData = error.response?.data;
      
      // Check if it's a borrow limit error
      if (errorData?.code === 'BORROW_LIMIT_REACHED') {
        setUpgradeModalData({
          currentLimit: errorData.currentLimit,
          activeBorrows: errorData.activeBorrows,
          isPremium: errorData.isPremium
        });
        handleCloseDetailsModal();
      } else {
        const errorMessage = errorData?.message || 'Failed to send borrow request.';
        toast.error(`❌ ${errorMessage}`, { duration: 4000 });
      }
    } finally {
      setBorrowing(null);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!currentUser || !user) return;

    setSendingFriendRequest(true);
    try {
      await friendsAPI.sendRequest(user._id);
      setFriendshipStatus('sent');
      toast.success(`Friend request sent to ${user.name}!`);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send friend request';
      toast.error(errorMessage);
    } finally {
      setSendingFriendRequest(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!friendshipId) return;

    try {
      await friendsAPI.respond(friendshipId, 'accept');
      setFriendshipStatus('friends');
      toast.success(`You are now friends with ${user.name}!`);
    } catch (error) {
      toast.error('Failed to accept friend request');
    }
  };

  const handleRejectFriendRequest = async () => {
    if (!friendshipId) return;

    try {
      await friendsAPI.respond(friendshipId, 'reject');
      setFriendshipStatus(null);
      setFriendshipId(null);
      toast.success('Friend request rejected');
    } catch (error) {
      toast.error('Failed to reject friend request');
    }
  };

  const handleCancelFriendRequest = async () => {
    if (!friendshipId) return;

    try {
      await friendsAPI.cancelRequest(friendshipId);
      setFriendshipStatus(null);
      setFriendshipId(null);
      toast.success('Friend request cancelled');
    } catch (error) {
      toast.error('Failed to cancel friend request');
    }
  };

  const handleRemoveFriend = async () => {
    if (!friendshipId) return;

    if (window.confirm(`Are you sure you want to remove ${user.name} from your friends?`)) {
      try {
        await friendsAPI.remove(friendshipId);
        setFriendshipStatus(null);
        setFriendshipId(null);
        toast.success(`Removed ${user.name} from friends`);
      } catch (error) {
        toast.error('Failed to remove friend');
      }
    }
  };

  const getDistance = (userCoords, currentCoords) => {
    if (!userCoords || !currentCoords) return null;
    const R = 6371;
    const lat1 = currentCoords[1] * Math.PI / 180;
    const lat2 = userCoords[1] * Math.PI / 180;
    const deltaLat = (userCoords[1] - currentCoords[1]) * Math.PI / 180;
    const deltaLon = (userCoords[0] - currentCoords[0]) * Math.PI / 180;
    const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const handleDistanceClick = () => {
    if (user?.location?.coordinates) {
      // Navigate to map page with user data to show their popup
      navigate('/map', {
        state: {
          showUserPopup: {
            _id: user._id,
            name: user.name,
            location: user.location,
            avatar: user.avatar,
            booksOwned: user.booksOwned || [],
            rating: user.rating
          }
        }
      });
    } else {
      // Fallback to just opening the map
      navigate('/map');
    }
  };

  if (loading) {
    return (
      <StyledWrapper>
        <div className="loading-state">
          <Loader className="animate-spin" />
          <p>Loading user profile...</p>
        </div>
      </StyledWrapper>
    );
  }

  if (!user) {
    return (
      <StyledWrapper>
        <div className="loading-state">
          <div className="error-message">
            <h3>User Not Found</h3>
            <p>The user profile you're looking for doesn't exist or couldn't be loaded.</p>
            <p>User ID: {userId}</p>
          </div>
        </div>
      </StyledWrapper>
    );
  }

  const distance = getDistance(user.location?.coordinates, currentUser?.location?.coordinates);
  const totalBooksCount = user.booksOwned?.length || 0;

  return (
    <>
      <UpgradeModal
        isOpen={!!upgradeModalData}
        onClose={() => setUpgradeModalData(null)}
        currentLimit={upgradeModalData?.currentLimit}
        activeBorrows={upgradeModalData?.activeBorrows}
        isPremium={upgradeModalData?.isPremium}
      />
      
      <StyledWrapper>
        <div className="profile-header-card">
        <div className="avatar-section">
          <AvatarImage src={getFullImageUrl(user.avatar)} alt={user.name} />
        </div>
        <div className="details-section">
          <h1 className="user-name">
            {user.name}
            {user.isVerified && <VerifiedBadge size={24} />}
          </h1>
          <div className="stats">
            <div className="stat-item">
              <BookOpen size={16} />
              <span>{totalBooksCount} {totalBooksCount === 1 ? 'Book' : 'Books'} in Bookshelf</span>
            </div>
            {distance !== null && (
              <div className="stat-item clickable-distance" onClick={handleDistanceClick}>
                <MapPin size={16} />
                <span>{distance} km away</span>
              </div>
            )}
          </div>

          {/* Rating Display with Star Level */}
          <div className="rating-section">
            <div className="star-level-display">
              {[1, 2, 3, 4, 5].map(n => (
                <Star 
                  key={n} 
                  size={20} 
                  fill={n <= (user.rating?.starLevel || 0) ? '#f59e0b' : 'none'}
                  color={n <= (user.rating?.starLevel || 0) ? '#f59e0b' : '#d1d5db'}
                />
              ))}
              <span className="star-level-text">
                {user.rating?.starLevel || 0} {user.rating?.starLevel === 1 ? 'Star' : 'Stars'}
              </span>
            </div>
            <div className="simple-rating">
              <Star size={18} fill="currentColor" style={{ color: '#fbbf24' }} />
              <span className="rating-value">
                {user.rating?.overallRating ? user.rating.overallRating.toFixed(1) : 'New'}
              </span>
              <button 
                className="reviews-link"
                onClick={() => setShowReviewsModal(true)}
              >
                {user.rating?.reviewCount || 0} {user.rating?.reviewCount === 1 ? 'Review' : 'Reviews'}
              </button>
            </div>
          </div>
        </div>
        <div className="actions-section" style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem' }}>
          <button className="message-btn" onClick={() => setMessageModalOpen(true)}>
            <Send size={18} /> Send Book Inquiry
          </button>

          {currentUser && user && currentUser._id !== user._id && (
            <>
              {friendshipStatus === null && (
                <button
                  className="message-btn"
                  style={{ backgroundColor: '#10B981' }}
                  onClick={handleSendFriendRequest}
                  disabled={sendingFriendRequest}
                >
                  {sendingFriendRequest ? 'Sending...' : 'Add Friend'}
                </button>
              )}

              {friendshipStatus === 'pending' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="message-btn"
                    style={{ backgroundColor: '#10B981' }}
                    onClick={handleAcceptFriendRequest}
                  >
                    Accept Request
                  </button>
                  <button
                    className="message-btn"
                    style={{ backgroundColor: '#EF4444' }}
                    onClick={handleRejectFriendRequest}
                  >
                    Reject
                  </button>
                </div>
              )}

              {friendshipStatus === 'sent' && (
                <button
                  className="message-btn"
                  style={{ backgroundColor: '#6B7280' }}
                  onClick={handleCancelFriendRequest}
                >
                  Cancel Request
                </button>
              )}

              {friendshipStatus === 'friends' && (
                <button
                  className="message-btn"
                  style={{ backgroundColor: '#EF4444' }}
                  onClick={handleRemoveFriend}
                >
                  Remove Friend
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="books-section">
        <h2>All Books ({totalBooksCount})</h2>
        {user.booksOwned && user.booksOwned.length > 0 ? (
          <div className="books-grid">
            {user.booksOwned.map(book => (
              <BookCard
                key={book._id}
                book={book}
                onClick={handleOpenDetailsModal}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <BookOpen size={40} />
            <h3>No Books Found</h3>
            <p>{user.name} hasn't added any books to their collection yet.</p>
          </div>
        )}
      </div>

      {isMessageModalOpen && <MessageModal user={user} onClose={() => setMessageModalOpen(false)} />}

      <BookDetailsModal
        isOpen={!!viewingBook}
        onClose={handleCloseDetailsModal}
        book={viewingBook}
        onRequest={handleBorrowRequest}
      />

      <ReviewsModal 
        open={showReviewsModal}
        onClose={() => setShowReviewsModal(false)}
        userId={user._id}
        userName={user.name}
      />
    </StyledWrapper>
    </>
  );
};

const StyledWrapper = styled.div`
  padding: 2rem 3rem;
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;

  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
  }

  @media (max-width: 480px) {
    padding: 1rem 0.75rem;
  }

  .loading-state {
    display: flex; flex-direction: column; justify-content: center; align-items: center; height: 80vh;
    font-size: 1.25rem; color: #4b5563; text-align: center;
    .animate-spin { width: 3rem; height: 3rem; color: #4F46E5; margin-bottom: 1rem; }
    
    .error-message {
      max-width: 500px;
      h3 { font-size: 1.5rem; font-weight: 700; color: #ef4444; margin-bottom: 1rem; }
      p { margin-bottom: 0.5rem; color: #6b7280; }
    }
    
    @media (max-width: 768px) {
      font-size: 1.125rem;
      
      .animate-spin {
        width: 2.5rem;
        height: 2.5rem;
      }
      
      .error-message h3 {
        font-size: 1.25rem;
      }
    }
  }
  
  .profile-header-card {
    display: grid; 
    grid-template-columns: auto 1fr auto; 
    align-items: flex-start;
    gap: 2rem; 
    background-color: white; 
    padding: 2rem; 
    border-radius: 1rem;
    border: 1px solid #e5e7eb; 
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    margin-bottom: 3rem;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 1.5rem;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }
    
    @media (max-width: 480px) {
      padding: 1.25rem;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
      border-radius: 0.75rem;
    }
  }
  
  .avatar-section {
    @media (max-width: 768px) {
      display: flex;
      justify-content: center;
    }
    
    img {
      width: 120px; 
      height: 120px; 
      border-radius: 50%;
      object-fit: cover; 
      border: 4px solid #eef2ff;
      
      @media (max-width: 768px) {
        width: 100px;
        height: 100px;
      }
      
      @media (max-width: 480px) {
        width: 90px;
        height: 90px;
        border: 3px solid #eef2ff;
      }
    }
  }
  
  .details-section {
    @media (max-width: 768px) {
      text-align: center;
    }
  }
  
  .user-name { 
    font-size: 2.5rem; 
    font-weight: 800; 
    color: #111827;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    @media (max-width: 768px) {
      font-size: 2rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    @media (max-width: 480px) {
      font-size: 1.75rem;
    }
  }
  .stats { 
    display: flex; 
    gap: 1.5rem; 
    margin-top: 0.75rem;
    
    @media (max-width: 768px) {
      justify-content: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    @media (max-width: 480px) {
      gap: 0.75rem;
    }
  }
  
  .stat-item {
      display: flex; 
      align-items: center; 
      gap: 0.5rem; 
      font-size: 1rem;
      font-weight: 500; 
      color: #4b5563;
      
      @media (max-width: 768px) {
        font-size: 0.9375rem;
      }
      
      @media (max-width: 480px) {
        font-size: 0.875rem;
        gap: 0.375rem;
      }
      
      svg { 
        color: #4F46E5;
        
        @media (max-width: 480px) {
          width: 14px;
          height: 14px;
        }
      }
      
      &.clickable-distance {
        cursor: pointer;
        transition: color 0.2s ease;
        
        &:hover {
          color: #0369a1;
          
          svg {
            color: #0369a1;
          }
          
          span {
            text-decoration: underline;
          }
        }
      }
  }
  
  .rating-section {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
    
    @media (max-width: 768px) {
      margin-top: 1.25rem;
      padding-top: 1.25rem;
    }
  }
  
  .star-level-display {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
    
    @media (max-width: 768px) {
      justify-content: center;
    }
    
    @media (max-width: 480px) {
      gap: 0.125rem;
      
      svg {
        width: 18px;
        height: 18px;
      }
    }
    
    .star-level-text {
      margin-left: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #6b7280;
      
      @media (max-width: 480px) {
        font-size: 0.8125rem;
        margin-left: 0.375rem;
      }
    }
  }
  
  .simple-rating {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    @media (max-width: 768px) {
      justify-content: center;
    }
    
    @media (max-width: 480px) {
      gap: 0.375rem;
      
      svg {
        width: 16px;
        height: 16px;
      }
    }
    
    .rating-value {
      font-size: 1.125rem;
      font-weight: 600;
      color: #374151;
      
      @media (max-width: 480px) {
        font-size: 1rem;
      }
    }
    
    .reviews-link {
      background: none;
      border: none;
      color: #4F46E5;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      transition: all 0.2s;
      
      @media (max-width: 480px) {
        font-size: 0.8125rem;
        padding: 0.2rem 0.4rem;
      }
      
      &:hover {
        background: #eef2ff;
        color: #4338ca;
      }
    }
    
    .rating-count {
      font-size: 0.875rem;
      color: #6b7280;
      
      @media (max-width: 480px) {
        font-size: 0.8125rem;
      }
    }
  }
  
  .actions-section {
    @media (max-width: 768px) {
      width: 100%;
      flex-direction: column !important;
      
      button {
        width: 100%;
      }
    }
  }
  
  .message-btn {
    display: inline-flex; 
    align-items: center; 
    gap: 0.5rem; 
    background-color: #4F46E5;
    color: white; 
    font-size: 1rem; 
    font-weight: 600; 
    padding: 0.75rem 1.5rem;
    border: none; 
    border-radius: 0.5rem; 
    cursor: pointer; 
    transition: background-color 0.2s;
    white-space: nowrap;
    
    @media (max-width: 768px) {
      width: 100%;
      justify-content: center;
      padding: 0.875rem 1.25rem;
    }
    
    @media (max-width: 480px) {
      font-size: 0.9375rem;
      padding: 0.75rem 1rem;
      gap: 0.375rem;
      
      svg {
        width: 16px;
        height: 16px;
      }
    }
    
    &:hover:not(:disabled) { background-color: #4338ca; }
  }
  .books-section {
    h2 {
      font-size: 2rem; 
      font-weight: 800; 
      color: #111827; 
      margin-bottom: 2rem;
      padding-bottom: 1rem; 
      border-bottom: 1px solid #e5e7eb;
      
      @media (max-width: 768px) {
        font-size: 1.75rem;
        margin-bottom: 1.5rem;
        padding-bottom: 0.875rem;
      }
      
      @media (max-width: 480px) {
        font-size: 1.5rem;
        margin-bottom: 1.25rem;
        padding-bottom: 0.75rem;
      }
    }
  }
  
  .books-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
    gap: 1.5rem;
    
    @media (max-width: 768px) {
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1.25rem;
    }
    
    @media (max-width: 480px) {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 1rem;
    }
  }
  
  .empty-state {
    text-align: center; 
    padding: 4rem 2rem; 
    background-color: #f9fafb;
    border-radius: 1rem; 
    color: #6b7280;
    
    @media (max-width: 768px) {
      padding: 3rem 1.5rem;
    }
    
    @media (max-width: 480px) {
      padding: 2.5rem 1rem;
      border-radius: 0.75rem;
    }
    
    svg { 
      margin: 0 auto 1.5rem auto; 
      color: #9ca3af;
      
      @media (max-width: 480px) {
        width: 32px;
        height: 32px;
        margin-bottom: 1rem;
      }
    }
    
    h3 { 
      font-size: 1.5rem; 
      font-weight: 700; 
      color: #111827;
      
      @media (max-width: 768px) {
        font-size: 1.375rem;
      }
      
      @media (max-width: 480px) {
        font-size: 1.25rem;
      }
    }
    
    p { 
      margin-top: 0.5rem; 
      max-width: 400px; 
      margin-left: auto; 
      margin-right: auto;
      
      @media (max-width: 768px) {
        font-size: 0.9375rem;
      }
      
      @media (max-width: 480px) {
        font-size: 0.875rem;
      }
    }
  }
`;

export default UserProfile;