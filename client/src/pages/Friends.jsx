import { useEffect, useState, useContext } from 'react';
import styled from 'styled-components';
import { friendsAPI, usersAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Search, Check, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import AnimatedAddButton from '../components/ui/AnimatedAddButton';

// Styled Components
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
  }
`;

const Title = styled.h1`
  font-size: 3rem;
      font-weight: 900;
      color: #111827;
      margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 2rem;
  }
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e9ecef;
  
  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
  }
`;

const Tab = styled.button`
  background: none;
  border: none;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.active ? '#8b5cf6' : '#6c757d'};
  border-bottom: 2px solid ${props => props.active ? '#8b5cf6' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: #8b5cf6;
  }
`;

const SearchAndAddContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const SearchContainer = styled.div`
  flex: 1;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #dee2e6;
  border-radius: 25px;
  font-size: 0.9rem;
  background-color: #f8f9fa;
  
  &:focus {
    outline: none;
    border-color: #8b5cf6;
    background-color: white;
  }
  
  &::placeholder {
    color: #adb5bd;
  }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: #adb5bd;
`;



const FriendsContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const SectionHeader = styled.div`
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-weight: 600;
  color: #495057;
`;

const FriendsList = styled.div`
  /* No scroll styling - content flows naturally */
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const FriendItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f8f9fa;
  transition: background-color 0.2s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f8f9fa;
  }
  
  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    
    ${Actions} {
      align-self: flex-end;
    }
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #8b5cf6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
  font-size: 0.9rem;
  ${props => props.src && `
    background-image: url(${props.src});
    background-size: cover;
    background-position: center;
  `}
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.div`
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
`;

const UserEmail = styled.div`
  font-size: 0.8rem;
  color: #6c757d;
`;

const ActionButton = styled.button`
  border: none;
  background: ${props => props.variant === 'primary' ? '#28a745' : props.variant === 'danger' ? '#dc3545' : '#f8f9fa'};
  color: ${props => props.variant === 'primary' || props.variant === 'danger' ? 'white' : '#6c757d'};
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    background: ${props =>
    props.variant === 'primary' ? '#218838' :
      props.variant === 'danger' ? '#c82333' : '#e9ecef'};
  }
`;

const IconButton = styled.button`
  border: none;
  background: #f8f9fa;
  color: #6c757d;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e9ecef;
    transform: translateY(-1px);
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #6c757d;
`;

const SearchResults = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 4px;
`;

const SearchResultItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f8f9fa;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f8f9fa;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const FriendsPage = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('friends');
  const [data, setData] = useState({ pending: [], sent: [], friends: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();

  const refresh = async () => {
    try {
      const { data: friendsData } = await friendsAPI.getAll();
      setData(friendsData);
    } catch (error) {
      console.error("Failed to fetch friends data:", error);
      toast.error("Failed to load friends data");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search users with debouncing (only for new users, not for filtering friends)
  useEffect(() => {
    // Only search for new users when not in friends tab or when search is focused on finding new users
    if (activeTab === 'friends') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setSearchLoading(true);
        try {
          const { data: users } = await usersAPI.searchUsers({ keyword: searchTerm });
          // Filter out current user and existing friends
          const filteredUsers = users.filter(u =>
            u._id !== user._id &&
            !data.friends.some(f =>
              (f.requester._id === u._id || f.recipient._id === u._id)
            ) &&
            !data.pending.some(p => p.requester._id === u._id) &&
            !data.sent.some(s => s.recipient._id === u._id)
          );
          setSearchResults(filteredUsers);
          setShowSearchResults(true);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setSearchLoading(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, data, user._id, activeTab]);

  const handleSendFriendRequest = async (userId) => {
    try {
      await friendsAPI.sendRequest(userId);
      toast.success('Friend request sent!');
      setSearchTerm('');
      setShowSearchResults(false);
      refresh();
    } catch (error) {
      console.error('Failed to send friend request:', error);
      toast.error('Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await friendsAPI.respond(requestId, 'accept');
      toast.success('Friend request accepted!');
      refresh();
    } catch (error) {
      console.error('Failed to accept request:', error);
      toast.error('Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await friendsAPI.respond(requestId, 'reject');
      toast.success('Friend request rejected');
      refresh();
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error('Failed to reject request');
    }
  };



  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : name[0].toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const friendsCount = data.friends?.length || 0;
  const pendingCount = data.pending?.length || 0;

  // Filter friends based on search term when in friends tab
  const getFilteredFriends = () => {
    if (!searchTerm.trim() || activeTab !== 'friends') {
      return data.friends || [];
    }

    return (data.friends || []).filter(friendship => {
      const friend = friendship.requester._id === user._id
        ? friendship.recipient
        : friendship.requester;

      return friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        friend.email.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  // Sort filtered friends to show matching ones first
  const getSortedFilteredFriends = () => {
    const filtered = getFilteredFriends();

    if (!searchTerm.trim() || activeTab !== 'friends') {
      return filtered;
    }

    return filtered.sort((a, b) => {
      const friendA = a.requester._id === user._id ? a.recipient : a.requester;
      const friendB = b.requester._id === user._id ? b.recipient : b.requester;

      const nameMatchA = friendA.name.toLowerCase().startsWith(searchTerm.toLowerCase());
      const nameMatchB = friendB.name.toLowerCase().startsWith(searchTerm.toLowerCase());

      if (nameMatchA && !nameMatchB) return -1;
      if (!nameMatchA && nameMatchB) return 1;

      return friendA.name.localeCompare(friendB.name);
    });
  };

  return (
    <Container>
      <Header>
        <Title>Friends</Title>

        <TabContainer>
          <Tab
            active={activeTab === 'friends'}
            onClick={() => {
              setActiveTab('friends');
              setSearchTerm('');
              setShowSearchResults(false);
            }}
          >
            My Friends ({friendsCount})
          </Tab>
          <Tab
            active={activeTab === 'pending'}
            onClick={() => {
              setActiveTab('pending');
              setSearchTerm('');
              setShowSearchResults(false);
            }}
          >
            Pending Requests {pendingCount > 0 && `(${pendingCount})`}
          </Tab>
        </TabContainer>

        <SearchAndAddContainer>
          <SearchContainer className="search-container">
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder={activeTab === 'friends' ? "Search Friends..." : "Search Users..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0 && activeTab !== 'friends') setShowSearchResults(true);
              }}
            />
            {showSearchResults && activeTab !== 'friends' && (
              <SearchResults>
                {searchLoading ? (
                  <SearchResultItem>Searching...</SearchResultItem>
                ) : searchResults.length > 0 ? (
                  searchResults.map(user => (
                    <SearchResultItem key={user._id}>
                      <UserInfo>
                        <Avatar
                          src={user.avatar}
                          style={{ backgroundColor: getAvatarColor(user.name) }}
                        >
                          {!user.avatar && getInitials(user.name)}
                        </Avatar>
                        <UserDetails>
                          <UserName>{user.name}</UserName>
                          <UserEmail>{user.email}</UserEmail>
                        </UserDetails>
                      </UserInfo>
                      <ActionButton
                        variant="primary"
                        onClick={() => handleSendFriendRequest(user._id)}
                      >
                        Add Friend
                      </ActionButton>
                    </SearchResultItem>
                  ))
                ) : searchTerm.length >= 2 ? (
                  <SearchResultItem>No users found</SearchResultItem>
                ) : null}
              </SearchResults>
            )}
          </SearchContainer>
          <AnimatedAddButton onClick={() => navigate('/users')}>
            Add Friend
          </AnimatedAddButton>
        </SearchAndAddContainer>
      </Header>

      <FriendsContainer>
        {activeTab === 'friends' ? (
          <>
            <SectionHeader>Socials ( Friends )</SectionHeader>
            <FriendsList>
              {getSortedFilteredFriends().length > 0 ? (
                getSortedFilteredFriends().map(friendship => {
                  const friend = friendship.requester._id === user._id
                    ? friendship.recipient
                    : friendship.requester;

                  return (
                    <FriendItem key={friendship._id}>
                      <UserInfo>
                        <Avatar
                          src={friend.avatar}
                          style={{ backgroundColor: getAvatarColor(friend.name) }}
                        >
                          {!friend.avatar && getInitials(friend.name)}
                        </Avatar>
                        <UserDetails>
                          <UserName>{friend.name}</UserName>
                          <UserEmail>{friend.email}</UserEmail>
                        </UserDetails>
                      </UserInfo>
                      <Actions>
                        <IconButton
                          onClick={() => navigate(`/messages?userId=${friend._id}`)}
                          title="Send Message"
                        >
                          <MessageSquare />
                        </IconButton>
                      </Actions>
                    </FriendItem>
                  );
                })
              ) : searchTerm.trim() && activeTab === 'friends' ? (
                <EmptyState>
                  <p>No friends found matching "{searchTerm}"</p>
                </EmptyState>
              ) : (
                <EmptyState>
                  <p>No friends yet. Start by searching and adding friends!</p>
                </EmptyState>
              )}
            </FriendsList>
          </>
        ) : (
          <>
            <SectionHeader>Pending Friend Requests</SectionHeader>
            <FriendsList>
              {data.pending?.length > 0 ? (
                data.pending.map(request => (
                  <FriendItem key={request._id}>
                    <UserInfo>
                      <Avatar
                        src={request.requester.avatar}
                        style={{ backgroundColor: getAvatarColor(request.requester.name) }}
                      >
                        {!request.requester.avatar && getInitials(request.requester.name)}
                      </Avatar>
                      <UserDetails>
                        <UserName>{request.requester.name}</UserName>
                        <UserEmail>{request.requester.email}</UserEmail>
                      </UserDetails>
                    </UserInfo>
                    <Actions>
                      <ActionButton
                        variant="primary"
                        onClick={() => handleAcceptRequest(request._id)}
                      >
                        <Check size={14} />
                        Accept
                      </ActionButton>
                      <ActionButton
                        variant="danger"
                        onClick={() => handleRejectRequest(request._id)}
                      >
                        <X size={14} />
                        Reject
                      </ActionButton>
                    </Actions>
                  </FriendItem>
                ))
              ) : (
                <EmptyState>
                  <p>No pending friend requests</p>
                </EmptyState>
              )}
            </FriendsList>
          </>
        )}
      </FriendsContainer>
    </Container>
  );
};

export default FriendsPage;