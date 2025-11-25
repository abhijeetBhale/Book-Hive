import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { messagesAPI } from '../utils/api';
import { UserX, Unlock, Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 80px);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  
  .back-btn {
    background: none;
    border: none;
    color: #4299e1;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: #f7fafc;
    }
  }
  
  h1 {
    font-size: 28px;
    font-weight: 700;
    color: #2d3748;
    margin: 0;
  }
`;

const SearchBar = styled.div`
  position: relative;
  margin-bottom: 24px;
  
  .search-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #a0aec0;
  }
  
  input {
    width: 100%;
    padding: 12px 16px 12px 48px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    font-size: 15px;
    outline: none;
    transition: all 0.2s;
    
    &:focus {
      border-color: #4299e1;
      box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
    }
    
    &::placeholder {
      color: #a0aec0;
    }
  }
`;

const BlockedUsersList = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const BlockedUserItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  transition: background-color 0.2s;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f7fafc;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }
  
  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .details {
    flex: 1;
    
    .name {
      font-size: 16px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 4px;
    }
    
    .email {
      font-size: 14px;
      color: #718096;
    }
  }
  
  .unblock-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #4299e1;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background: #3182ce;
      transform: translateY(-1px);
    }
    
    &:active {
      transform: translateY(0);
    }
    
    &:disabled {
      background: #cbd5e0;
      cursor: not-allowed;
      transform: none;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  
  .icon {
    color: #cbd5e0;
    margin-bottom: 16px;
  }
  
  h3 {
    font-size: 20px;
    font-weight: 600;
    color: #4a5568;
    margin-bottom: 8px;
  }
  
  p {
    font-size: 15px;
    color: #718096;
    line-height: 1.6;
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #718096;
  font-size: 15px;
`;

const InfoBox = styled.div`
  background: #ebf8ff;
  border: 1px solid #bee3f8;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  
  .info-title {
    font-size: 15px;
    font-weight: 600;
    color: #2c5282;
    margin-bottom: 8px;
  }
  
  .info-text {
    font-size: 14px;
    color: #2c5282;
    line-height: 1.6;
  }
`;

const BlockedUsers = () => {
  const navigate = useNavigate();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [unblockingUserId, setUnblockingUserId] = useState(null);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(blockedUsers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = blockedUsers.filter(user => 
        user.name.toLowerCase().includes(query) || 
        user.email.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, blockedUsers]);

  const fetchBlockedUsers = async () => {
    try {
      setLoading(true);
      const { data } = await messagesAPI.getBlockedUsers();
      setBlockedUsers(data.blockedUsers || []);
    } catch (error) {
      console.error('Failed to fetch blocked users:', error);
      toast.error('Failed to load blocked users');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId, userName) => {
    try {
      setUnblockingUserId(userId);
      await messagesAPI.unblockUser(userId);
      
      // Remove from local state
      setBlockedUsers(prev => prev.filter(user => user._id !== userId));
      
      toast.success(`${userName} has been unblocked`);
    } catch (error) {
      console.error('Failed to unblock user:', error);
      toast.error('Failed to unblock user. Please try again.');
    } finally {
      setUnblockingUserId(null);
    }
  };

  return (
    <Container>
      <Header>
        <button className="back-btn" onClick={() => navigate('/messages')} title="Back to Messages">
          <ArrowLeft size={24} />
        </button>
        <h1>Blocked Users</h1>
      </Header>

      <InfoBox>
        <div className="info-title">About Blocked Users</div>
        <div className="info-text">
          When you block someone, they won't be able to send you messages or see your online status. 
          You can unblock them anytime to restore communication.
        </div>
      </InfoBox>

      {!loading && blockedUsers.length > 0 && (
        <SearchBar>
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search blocked users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchBar>
      )}

      {loading ? (
        <LoadingState>Loading blocked users...</LoadingState>
      ) : blockedUsers.length === 0 ? (
        <BlockedUsersList>
          <EmptyState>
            <UserX className="icon" size={64} />
            <h3>No Blocked Users</h3>
            <p>
              You haven't blocked anyone yet. When you block someone, 
              they'll appear here and you can unblock them anytime.
            </p>
          </EmptyState>
        </BlockedUsersList>
      ) : filteredUsers.length === 0 ? (
        <BlockedUsersList>
          <EmptyState>
            <Search className="icon" size={48} />
            <h3>No Results Found</h3>
            <p>No blocked users match your search query.</p>
          </EmptyState>
        </BlockedUsersList>
      ) : (
        <BlockedUsersList>
          {filteredUsers.map(user => (
            <BlockedUserItem key={user._id}>
              <div className="user-info">
                <img
                  className="avatar"
                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=EEF2FF&color=111827`}
                  alt={user.name}
                />
                <div className="details">
                  <div className="name">{user.name}</div>
                  <div className="email">{user.email}</div>
                </div>
              </div>
              <button
                className="unblock-btn"
                onClick={() => handleUnblock(user._id, user.name)}
                disabled={unblockingUserId === user._id}
              >
                <Unlock size={16} />
                {unblockingUserId === user._id ? 'Unblocking...' : 'Unblock'}
              </button>
            </BlockedUserItem>
          ))}
        </BlockedUsersList>
      )}
    </Container>
  );
};

export default BlockedUsers;
