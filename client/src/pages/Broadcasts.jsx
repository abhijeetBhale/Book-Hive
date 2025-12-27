import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Search, Clock, User, MessageCircle, Check, X, Radio, BookOpen, Plus, Loader, Calendar } from 'lucide-react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Styled Components matching BorrowRequests page
const StyledWrapper = styled.div`
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;

  @media (min-width: 768px) {
    padding: 2rem 3rem;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .main-title {
    font-size: 2.5rem;
    font-weight: 800;
    color: #111827;
  }

  .subtitle {
    font-size: 1.125rem;
    color: #4b5563;
    margin-top: 0.5rem;
  }

  .tabs-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 2rem;
  }

  .tabs-left {
    display: flex;
  }

  .tab-btn {
    padding: 1rem 0.5rem;
    margin: 0 1.5rem 0 0;
    border: none;
    background: none;
    font-size: 1rem;
    font-weight: 600;
    color: #6b7280;
    cursor: pointer;
    position: relative;
    transition: color 0.2s ease-in-out;
    
    &:hover {
      color: #111827;
    }
    
    &.active {
      color: #4F46E5;
    }

    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: #4F46E5;
      transform: scaleX(0);
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    &.active::after {
      transform: scaleX(1);
    }
  }

  .create-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 0.5rem;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(79, 70, 229, 0.3);
    }
  }

  .content-area {
    min-height: 400px;
  }

  .loading-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 400px;
  }

  .requests-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    
    @media (min-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (min-width: 1024px) {
      gap: 2rem;
    }
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    gap: 2rem;
  }
`;

const Card = styled.div`
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  overflow: hidden;
  display: flex;
  align-items: stretch;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  min-height: 180px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.07);
  }
`;

const BookCoverContainer = styled.div`
  width: 100px;
  height: 100%;
  flex-shrink: 0;
  overflow: hidden;
  background-color: #f3f4f6;
`;

const BookCover = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  background-color: #f9fafb;
`;

const BookCoverPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    color: #4f46e5;
  }
`;

const CardContent = styled.div`
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const CardHeader = styled.div`
  margin-bottom: 0.75rem;
`;

const BookTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
  line-height: 1.4;
`;

const BookAuthor = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
`;

const RequesterInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const RequesterAvatar = styled.img`
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  object-fit: cover;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const RequesterName = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const VerifiedBadge = styled.span`
  color: #4f46e5;
  font-size: 1rem;
  line-height: 1;
`;

const RequestDate = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
`;

const StatusBadge = styled.span`
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  white-space: nowrap;
  
  ${props => {
    switch(props.$status) {
      case 'active':
        return 'background: #d1fae5; color: #065f46;';
      case 'fulfilled':
        return 'background: #dbeafe; color: #1e40af;';
      default:
        return 'background: #f3f4f6; color: #374151;';
    }
  }}
`;

const Description = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const MetaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  border-top: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 1rem;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: #6b7280;

  svg {
    color: #9ca3af;
  }

  strong {
    color: #374151;
    font-weight: 600;
  }
`;

const ResponsesList = styled.div`
  margin-bottom: 1rem;
`;

const ResponsesHeader = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ResponseItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  border: 1px solid #e5e7eb;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ResponderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Avatar = styled.img`
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  object-fit: cover;
  border: 2px solid white;
`;

const ResponderName = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const ConfirmButton = styled.button`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px -1px rgba(16, 185, 129, 0.3);
  }
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  ${props => {
    if (props.$variant === 'primary') {
      return `
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        color: white;
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px -1px rgba(79, 70, 229, 0.3);
        }
      `;
    } else if (props.$variant === 'danger') {
      return `
        background: #fee2e2;
        color: #dc2626;
        &:hover {
          background: #fecaca;
        }
      `;
    } else if (props.$variant === 'disabled') {
      return `
        background: #f3f4f6;
        color: #9ca3af;
        cursor: not-allowed;
      `;
    }
  }}

  &:disabled {
    background: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
`;

const SuccessMessage = styled.div`
  padding: 0.875rem;
  background: #d1fae5;
  border: 1px solid #a7f3d0;
  border-radius: 0.5rem;
  color: #065f46;
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 1rem;
  border: 2px dashed #e5e7eb;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const EmptyIcon = styled.div`
  width: 4rem;
  height: 4rem;
  background: linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;

  svg {
    color: #4f46e5;
  }
`;

const EmptyTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
`;

const EmptyText = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
`;

const Modal = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 1rem;
  max-width: 32rem;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 80px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const CharCount = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  text-align: right;
  margin-top: 0.25rem;
`;

const SearchResults = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  margin-top: 0.25rem;
  max-height: 16rem;
  overflow-y: auto;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 10;
`;

const SearchResultItem = styled.div`
  padding: 0.75rem;
  cursor: pointer;
  display: flex;
  gap: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.2s;

  &:hover {
    background: #f9fafb;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const SearchResultImage = styled.img`
  width: 3rem;
  height: 4rem;
  object-fit: cover;
  border-radius: 0.25rem;
  flex-shrink: 0;
`;

const SearchResultInfo = styled.div`
  flex: 1;
`;

const SearchResultTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
`;

const SearchResultAuthor = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
`;

const ModalFooter = styled.div`
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 0.75rem;
`;

const Button = styled.button`
  flex: 1;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  ${props => {
    if (props.$variant === 'primary') {
      return `
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        color: white;
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px -1px rgba(79, 70, 229, 0.3);
        }
      `;
    } else {
      return `
        background: white;
        color: #374151;
        border: 1px solid #d1d5db;
        &:hover {
          background: #f9fafb;
        }
      `;
    }
  }}
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid #e5e7eb;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const InfoBox = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 0.75rem;
  font-size: 0.875rem;
  color: #1e40af;
  margin-top: 0.5rem;
`;

const BookPreview = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  margin-bottom: 1rem;
`;

const PreviewCover = styled.img`
  width: 70px;
  height: 105px;
  object-fit: cover;
  border-radius: 0.375rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
`;

const PreviewInfo = styled.div`
  flex: 1;
`;

const PreviewTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
`;

const PreviewAuthor = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 1rem;

  svg {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
`;

export default function Broadcasts() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [broadcasts, setBroadcasts] = useState([]);
  const [myBroadcasts, setMyBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [formData, setFormData] = useState({
    bookTitle: '',
    bookAuthor: '',
    description: '',
    durationNeeded: 30,
    bookCoverUrl: ''
  });

  useEffect(() => {
    fetchBroadcasts();
    fetchMyBroadcasts();

    // Setup socket listener for fulfilled broadcasts
    const token = localStorage.getItem('token');
    if (token) {
      import('socket.io-client').then(({ io }) => {
        const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
        const socket = io(base, {
          auth: { token },
          transports: ['websocket', 'polling']
        });

        socket.on('broadcast:fulfilled', (data) => {
          // Remove the fulfilled broadcast from both lists
          setBroadcasts(prev => prev.filter(b => b._id !== data.broadcastId));
          setMyBroadcasts(prev => prev.filter(b => b._id !== data.broadcastId));
        });

        return () => {
          socket.disconnect();
        };
      });
    }
  }, []);

  const fetchBroadcasts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/broadcasts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      // Only show active broadcasts
      const activeBroadcasts = (data.broadcasts || []).filter(b => b.status === 'active');
      setBroadcasts(activeBroadcasts);
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBroadcasts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/broadcasts/my-broadcasts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setMyBroadcasts(data.broadcasts || []);
    } catch (error) {
      console.error('Error fetching my broadcasts:', error);
    }
  };

  // Search Google Books API
  const searchGoogleBooks = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`
      );
      
      const books = response.data.items?.map(item => ({
        id: item.id,
        title: item.volumeInfo.title,
        authors: item.volumeInfo.authors?.join(', ') || 'Unknown Author',
        description: item.volumeInfo.description || '',
        thumbnail: item.volumeInfo.imageLinks?.thumbnail || ''
      })) || [];
      
      setSearchResults(books);
    } catch (error) {
      console.error('Error searching books:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchGoogleBooks(query);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };

  const selectBook = (book) => {
    setSelectedBook(book);
    setFormData({
      ...formData,
      bookTitle: book.title,
      bookAuthor: book.authors,
      description: book.description.substring(0, 500),
      bookCoverUrl: book.thumbnail
    });
    setSearchQuery(book.title);
    setSearchResults([]);
  };

  const handleCreateBroadcast = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/broadcasts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Broadcast created! Users will be notified.');
        setShowCreateModal(false);
        setFormData({ bookTitle: '', bookAuthor: '', description: '', durationNeeded: 30, bookCoverUrl: '' });
        setSearchQuery('');
        setSelectedBook(null);
        setActiveTab('mine'); // Switch to My Requests tab
        fetchBroadcasts();
        fetchMyBroadcasts();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to create broadcast');
      }
    } catch (error) {
      toast.error('Error creating broadcast');
    }
  };

  const handleRespond = async (broadcastId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/broadcasts/${broadcastId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: 'I have this book available!' })
      });

      if (response.ok) {
        toast.success('Response sent! The requester will be notified.');
        fetchBroadcasts();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to respond');
      }
    } catch (error) {
      toast.error('Error sending response');
    }
  };

  const handleConfirmResponder = async (broadcastId, responderId, responderName) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/broadcasts/${broadcastId}/confirm/${responderId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Confirmed! Opening chat with ${responderName}...`);
        
        // Remove the broadcast from lists immediately
        setBroadcasts(prev => prev.filter(b => b._id !== broadcastId));
        setMyBroadcasts(prev => prev.filter(b => b._id !== broadcastId));
        
        // Redirect to messages immediately
        navigate('/messages');
      } else {
        toast.error(data.message || 'Failed to confirm');
        console.error('Confirmation failed:', data);
      }
    } catch (error) {
      console.error('Error confirming responder:', error);
      toast.error('Error confirming responder: ' + error.message);
    }
  };

  const handleCancelBroadcast = async (broadcastId) => {
    if (!confirm('Are you sure you want to cancel this broadcast?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/broadcasts/${broadcastId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Broadcast cancelled');
        fetchMyBroadcasts();
        fetchBroadcasts();
      }
    } catch (error) {
      toast.error('Error cancelling broadcast');
    }
  };

  const BroadcastCard = ({ broadcast, isMine = false }) => {
    const hasResponded = broadcast.responses?.some(r => r.responder._id === user?._id);
    const isActive = broadcast.status === 'active';

    return (
      <Card>
        <BookCoverContainer>
          {broadcast.bookCoverUrl ? (
            <BookCover src={broadcast.bookCoverUrl} alt={broadcast.bookTitle} />
          ) : (
            <BookCoverPlaceholder>
              <BookOpen size={32} />
            </BookCoverPlaceholder>
          )}
        </BookCoverContainer>
        
        <CardContent>
          <CardHeader>
            <BookTitle>{broadcast.bookTitle}</BookTitle>
            {broadcast.bookAuthor && (
              <BookAuthor>by {broadcast.bookAuthor}</BookAuthor>
            )}
          </CardHeader>
          
          <RequesterInfo>
            <RequesterAvatar
              src={broadcast.requester?.avatar || '/default-avatar.png'}
              alt={broadcast.requester?.name}
            />
            <div>
              <RequesterName>
                {broadcast.requester?.name}
                {broadcast.requester?.isVerified && <VerifiedBadge>✓</VerifiedBadge>}
              </RequesterName>
              <RequestDate>
                <Calendar size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                {formatDistanceToNow(new Date(broadcast.createdAt), { addSuffix: true })}
              </RequestDate>
            </div>
          </RequesterInfo>

          <StatusBadge $status={broadcast.status}>
            {broadcast.status}
          </StatusBadge>

          {broadcast.description && (
            <Description>{broadcast.description}</Description>
          )}

          <MetaInfo>
            <MetaItem>
              <Clock size={16} />
              <strong>{broadcast.durationNeeded} days</strong>
            </MetaItem>
            <MetaItem>
              <MessageCircle size={16} />
              <strong>{broadcast.responses?.length || 0} responses</strong>
            </MetaItem>
          </MetaInfo>

          {isMine && broadcast.responses?.length > 0 && isActive && (
            <ResponsesList>
              <ResponsesHeader>
                <MessageCircle size={16} />
                Responses ({broadcast.responses.length})
              </ResponsesHeader>
              {broadcast.responses.map((response) => (
                <ResponseItem key={response._id}>
                  <ResponderInfo>
                    <Avatar
                      src={response.responder?.avatar || '/default-avatar.png'}
                      alt={response.responder?.name}
                    />
                    <ResponderName>
                      {response.responder?.name}
                      {response.responder?.isVerified && <VerifiedBadge>✓</VerifiedBadge>}
                    </ResponderName>
                  </ResponderInfo>
                  <ConfirmButton
                    onClick={() => handleConfirmResponder(broadcast._id, response.responder._id, response.responder?.name)}
                  >
                    <Check size={14} /> Confirm
                  </ConfirmButton>
                </ResponseItem>
              ))}
            </ResponsesList>
          )}

          {!isMine && isActive && (
            <ActionButton
              onClick={() => handleRespond(broadcast._id)}
              disabled={hasResponded}
              $variant={hasResponded ? 'disabled' : 'primary'}
            >
              {hasResponded ? (
                <>
                  <Check size={16} /> Already Responded
                </>
              ) : (
                <>
                  <BookOpen size={16} /> I Have This Book
                </>
              )}
            </ActionButton>
          )}

          {isMine && isActive && broadcast.responses?.length === 0 && (
            <ActionButton
              onClick={() => handleCancelBroadcast(broadcast._id)}
              $variant="danger"
            >
              <X size={16} /> Cancel Request
            </ActionButton>
          )}

          {broadcast.status === 'fulfilled' && (
            <SuccessMessage>
              <Check size={16} />
              Fulfilled - Check your messages!
            </SuccessMessage>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <StyledWrapper>
        <div className="loading-state">
          <Loader size={40} className="animate-spin" />
        </div>
      </StyledWrapper>
    );
  }

  const activeMyBroadcasts = myBroadcasts.filter(b => b.status === 'active');

  return (
    <StyledWrapper>
      <div className="page-header">
        <h1 className="main-title">Book Broadcasts</h1>
        <p className="subtitle">Can't find a book? Broadcast your request to the entire community</p>
      </div>

      <div className="tabs-container">
        <div className="tabs-left">
          <button 
            className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            Available Requests ({broadcasts.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'mine' ? 'active' : ''}`}
            onClick={() => setActiveTab('mine')}
          >
            My Requests ({activeMyBroadcasts.length})
          </button>
        </div>
        <button className="create-btn" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          Request a Book
        </button>
      </div>

      <div className="content-area">
        {/* Available Broadcasts Tab */}
        {activeTab === 'available' && (
          <>
            {broadcasts.length > 0 ? (
              <Grid>
                {broadcasts.map((broadcast) => (
                  <BroadcastCard key={broadcast._id} broadcast={broadcast} />
                ))}
              </Grid>
            ) : (
              <EmptyState>
                <EmptyIcon>
                  <Radio size={32} />
                </EmptyIcon>
                <EmptyTitle>No Available Broadcasts</EmptyTitle>
                <EmptyText>Be the first to request a book from the community!</EmptyText>
                <button className="create-btn" onClick={() => setShowCreateModal(true)}>
                  <Plus size={18} />
                  Create First Broadcast
                </button>
              </EmptyState>
            )}
          </>
        )}

        {/* My Broadcasts Tab */}
        {activeTab === 'mine' && (
          <>
            {activeMyBroadcasts.length > 0 ? (
              <Grid>
                {activeMyBroadcasts.map((broadcast) => (
                  <BroadcastCard key={broadcast._id} broadcast={broadcast} isMine={true} />
                ))}
              </Grid>
            ) : (
              <EmptyState>
                <EmptyIcon>
                  <Radio size={32} />
                </EmptyIcon>
                <EmptyTitle>No Active Requests</EmptyTitle>
                <EmptyText>You haven't created any broadcast requests yet.</EmptyText>
                <button className="create-btn" onClick={() => setShowCreateModal(true)}>
                  <Plus size={18} />
                  Create Your First Request
                </button>
              </EmptyState>
            )}
          </>
        )}
      </div>

      {/* Create Broadcast Modal */}
      {showCreateModal && (
        <Modal onClick={() => setShowCreateModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <Radio size={24} />
                Request a Book
              </ModalTitle>
            </ModalHeader>
            
            <form onSubmit={handleCreateBroadcast}>
              <ModalBody>
                <FormGroup>
                  <Label>Search for Book</Label>
                  <div style={{ position: 'relative' }}>
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder="Type book title or author..."
                    />
                    {searching && (
                      <div style={{ position: 'absolute', right: '0.75rem', top: '0.75rem' }}>
                        <LoadingSpinner />
                      </div>
                    )}
                    {searchResults.length > 0 && (
                      <SearchResults>
                        {searchResults.map((book) => (
                          <SearchResultItem
                            key={book.id}
                            onClick={() => selectBook(book)}
                          >
                            {book.thumbnail && (
                              <SearchResultImage src={book.thumbnail} alt={book.title} />
                            )}
                            <SearchResultInfo>
                              <SearchResultTitle>{book.title}</SearchResultTitle>
                              <SearchResultAuthor>{book.authors}</SearchResultAuthor>
                            </SearchResultInfo>
                          </SearchResultItem>
                        ))}
                      </SearchResults>
                    )}
                  </div>
                </FormGroup>

                {selectedBook && formData.bookCoverUrl && (
                  <BookPreview>
                    <PreviewCover src={formData.bookCoverUrl} alt={formData.bookTitle} />
                    <PreviewInfo>
                      <PreviewTitle>{formData.bookTitle}</PreviewTitle>
                      <PreviewAuthor>{formData.bookAuthor}</PreviewAuthor>
                    </PreviewInfo>
                  </BookPreview>
                )}

                <FormGroup>
                  <Label>Book Title *</Label>
                  <Input
                    type="text"
                    value={formData.bookTitle}
                    onChange={(e) => setFormData({ ...formData, bookTitle: e.target.value })}
                    placeholder="Enter book title"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Author (Optional)</Label>
                  <Input
                    type="text"
                    value={formData.bookAuthor}
                    onChange={(e) => setFormData({ ...formData, bookAuthor: e.target.value })}
                    placeholder="Enter author name"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Description (Optional)</Label>
                  <TextArea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Why do you need this book?"
                    maxLength="500"
                  />
                  <CharCount>{formData.description.length}/500 characters</CharCount>
                </FormGroup>

                <FormGroup>
                  <Label>Duration Needed (days) *</Label>
                  <Input
                    type="number"
                    value={formData.durationNeeded}
                    onChange={(e) => setFormData({ ...formData, durationNeeded: parseInt(e.target.value) })}
                    min="1"
                    max="365"
                    required
                  />
                  <InfoBox>
                    💡 You can request books for up to 365 days (1 year)
                  </InfoBox>
                </FormGroup>
              </ModalBody>

              <ModalFooter>
                <Button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSearchQuery('');
                    setSelectedBook(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" $variant="primary">
                  Create Broadcast
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      )}
    </StyledWrapper>
  );
}
