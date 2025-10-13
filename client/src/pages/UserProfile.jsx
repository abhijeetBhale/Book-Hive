import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { usersAPI, booksAPI, borrowAPI, notificationsAPI, friendsAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Loader, MapPin, BookOpen, Send, X, User as UserIcon, Star } from 'lucide-react';
import { getFullImageUrl } from '../utils/imageHelpers';


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

  .modal-content {
    background-color: white; border-radius: 1rem;
    width: 100%; max-width: 800px;
    position: relative; max-height: 90vh;
    overflow-y: auto; display: flex;
    flex-direction: column;
    animation: ${slideIn} 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
    @media (min-width: 768px) { flex-direction: row; }
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
  
  .details-pane { padding: 2rem 1.5rem; display: flex; flex-direction: column; flex-grow: 1; }
  .book-title { font-size: 1.75rem; font-weight: 800; color: #111827; line-height: 1.2; }
  .book-author { font-size: 1rem; color: #4b5563; margin-top: 0.25rem; margin-bottom: 1rem; }
  
  .status-badge {
    padding: 0.2rem 0.6rem; font-size: 0.75rem; font-weight: 600;
    border-radius: 9999px; text-transform: capitalize; align-self: flex-start;
    &.available { background-color: #dcfce7; color: #166534; }
    &.borrowed { background-color: #dbeafe; color: #1e40af; }
    margin-bottom: 1rem;
  }
  
  .details-grid {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem; margin-bottom: 1rem; font-size: 0.9rem;
    div {
      span:first-child { font-weight: 600; color: #1f2937; display: block; }
      span:last-child { color: #4b5563; }
    }
  }

  .description {
    margin-top: 1rem;
    h4 { font-weight: 700; color: #111827; margin-bottom: 0.5rem; }
    p { font-size: 0.9rem; color: #4b5563; line-height: 1.6; max-height: 150px; overflow-y: auto; }
  }
  
  .modal-footer { margin-top: auto; padding-top: 1.5rem; }
  
  .request-btn {
    width: 100%; display: inline-flex; align-items: center; justify-content: center;
    gap: 0.5rem; background-color: #4F46E5; color: white; font-size: 1rem; font-weight: 600;
    padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer;
    transition: background-color 0.2s;
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
          </div>

          <div className="description">
            <h4>Description</h4>
            <p>{book.description}</p>
          </div>

          <div className="modal-footer">
            <button
              className="request-btn"
              onClick={() => onRequest(book._id)}
              disabled={!book.isAvailable || !book.forBorrowing}
            >
              <Send size={18} />
              {book.isAvailable && book.forBorrowing ? 'Request This Book' : 'Currently Unavailable'}
            </button>
          </div>
        </div>
      </div>
    </StyledBookDetailsModal>
  );
};


// --- BOOK CARD COMPONENT ---
const StyledBookCard = styled.div`
  background-color: white; border: 1px solid #e5e7eb; border-radius: 1rem;
  overflow: hidden; display: flex; flex-direction: column;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.07);
  }
  .book-cover { width: 100%; aspect-ratio: 2 / 3; object-fit: cover; }
  .card-content { padding: 1rem; display: flex; flex-direction: column; flex-grow: 1; }
  .book-title { font-size: 1.125rem; font-weight: 700; color: #111827; }
  .book-author { font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem; margin-bottom: 1rem; flex-grow: 1; }
  .status-badge {
    display: inline-flex; align-items: center; justify-content: center;
    width: 100%; background-color: #f3f4f6; color: #6b7280; font-size: 0.875rem;
    font-weight: 600; padding: 0.75rem; border-radius: 0.5rem;
    text-align: center;
  }
`;

const BookCard = ({ book, onClick }) => {
  return (
    <StyledBookCard onClick={() => onClick(book)}>
      <img src={getFullImageUrl(book.coverImage)} alt={book.title} className="book-cover" />
      <div className="card-content">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">by {book.author}</p>
        <div className="status-badge">
          {!book.isAvailable ? 'Currently Borrowed' : book.forBorrowing ? 'Available to Borrow' : 'Not for Borrowing'}
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
  const { user: currentUser } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(null);
  const [isMessageModalOpen, setMessageModalOpen] = useState(false);
  const [viewingBook, setViewingBook] = useState(null);
  const [friendshipStatus, setFriendshipStatus] = useState(null); // null, 'pending', 'sent', 'friends'
  const [friendshipId, setFriendshipId] = useState(null);
  const [sendingFriendRequest, setSendingFriendRequest] = useState(false);


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

  useEffect(() => {
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
    if (id) fetchUserProfile();
  }, [id, currentUser]);

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
      const errorMessage = error.response?.data?.message || 'Failed to send borrow request.';
      toast.error(`❌ ${errorMessage}`, { duration: 4000 });
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
    <StyledWrapper>
      <div className="profile-header-card">
        <div className="avatar-section">
          <AvatarImage src={getFullImageUrl(user.avatar)} alt={user.name} />
        </div>
        <div className="details-section">
          <h1 className="user-name">{user.name}</h1>
          <div className="stats">
            <div className="stat-item">
              <BookOpen size={16} />
              <span>{totalBooksCount} {totalBooksCount === 1 ? 'Book' : 'Books'} in Bookshelf</span>
            </div>
            {distance !== null && (
              <div className="stat-item">
                <MapPin size={16} />
                <span>{distance} km away</span>
              </div>
            )}
          </div>

          {/* Simple Rating Display */}
          <div className="rating-section">
            <div className="simple-rating">
              <Star size={20} fill="currentColor" style={{ color: '#fbbf24' }} />
              <span className="rating-value">
                {user.rating?.overallRating || user.rating?.value || 'New'}
              </span>
              <span className="rating-count">
                ({user.rating?.totalRatings || user.rating?.count || 0} reviews)
              </span>
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
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  padding: 2rem 3rem;
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;

  .loading-state {
    display: flex; flex-direction: column; justify-content: center; align-items: center; height: 80vh;
    font-size: 1.25rem; color: #4b5563; text-align: center;
    .animate-spin { width: 3rem; height: 3rem; color: #4F46E5; margin-bottom: 1rem; }
    
    .error-message {
      max-width: 500px;
      h3 { font-size: 1.5rem; font-weight: 700; color: #ef4444; margin-bottom: 1rem; }
      p { margin-bottom: 0.5rem; color: #6b7280; }
    }
  }
  .profile-header-card {
    display: grid; grid-template-columns: auto 1fr auto; align-items: flex-start;
    gap: 2rem; background-color: white; padding: 2rem; border-radius: 1rem;
    border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    margin-bottom: 3rem;
  }
  .avatar-section img {
      width: 120px; height: 120px; border-radius: 50%;
      object-fit: cover; border: 4px solid #eef2ff;
  }
  .user-name { font-size: 2.5rem; font-weight: 800; color: #111827; }
  .stats { display: flex; gap: 1.5rem; margin-top: 0.75rem; }
  .stat-item {
      display: flex; align-items: center; gap: 0.5rem; font-size: 1rem;
      font-weight: 500; color: #4b5563;
      svg { color: #4F46E5; }
  }
  
  .rating-section {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .simple-rating {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    .rating-value {
      font-size: 1.125rem;
      font-weight: 600;
      color: #374151;
    }
    
    .rating-count {
      font-size: 0.875rem;
      color: #6b7280;
    }
  }
  .message-btn {
    display: inline-flex; align-items: center; gap: 0.5rem; background-color: #4F46E5;
    color: white; font-size: 1rem; font-weight: 600; padding: 0.75rem 1.5rem;
    border: none; border-radius: 0.5rem; cursor: pointer; transition: background-color 0.2s;
    &:hover:not(:disabled) { background-color: #4338ca; }
  }
  .books-section h2 {
      font-size: 2rem; font-weight: 800; color: #111827; margin-bottom: 2rem;
      padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb;
  }
  .books-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
  .empty-state {
    text-align: center; padding: 4rem 2rem; background-color: #f9fafb;
    border-radius: 1rem; color: #6b7280;
    svg { margin: 0 auto 1.5rem auto; color: #9ca3af; }
    h3 { font-size: 1.5rem; font-weight: 700; color: #111827; }
    p { margin-top: 0.5rem; max-width: 400px; margin-left: auto; margin-right: auto; }
  }
`;

export default UserProfile;