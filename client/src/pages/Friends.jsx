import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { friendsAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X, UserX } from 'lucide-react';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

// Styled Components
const Wrapper = styled.div`
  padding: 2rem;
  background-color: #f9f9f9;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  min-height: 100vh;
`;

const Card = styled.div`
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  animation: ${fadeIn} 0.5s ease-in-out;
`;

const CardHeader = styled.div`
  padding: 1rem 1.5rem;
  font-weight: 700;
  font-size: 1.25rem;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
  `;
  
  const ItemList = styled.div`
  padding: 0.5rem 0;
  flex-grow: 1;
  `;
  
  const Item = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f5f5f5;
  transition: background-color 0.2s ease-in-out;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #fcfcfc;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Avatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #555;
  font-size: 1.25rem;
  background-image: url(${props => props.src});
  background-size: cover;
  background-position: center;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.div`
  font-weight: 600;
  color: #333;
`;

const UserEmail = styled.div`
  font-size: 0.875rem;
  color: #777;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const IconButton = styled.button`
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  transition: all 0.2s ease-in-out;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background-color: #f0f0f0;
    transform: scale(1.1);
  }
`;

const MessageButton = styled(IconButton)`
  &:hover { 
    background-color: #e0f7fa;
    color: #008CBA; 
  }
`;

const CancelButton = styled(IconButton)`
  &:hover { 
    background-color: #ffebee;
    color: #f44336;
  }
`;

const RemoveButton = styled(IconButton)`
  &:hover { 
    background-color: #ffebee;
    color: #f44336;
  }
`;


const PrimaryButton = styled.button`
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: #45a049;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
`;

const SecondaryButton = styled.button`
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: #e53935;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
`;


const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: ${fadeIn} 0.3s;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 400px;
  width: 90%;
  animation: ${slideIn} 0.3s;

  h2 {
    margin-top: 0;
    color: #333;
  }

  p {
    color: #666;
    margin-bottom: 2rem;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
`;

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>
        <ModalActions>
          <PrimaryButton onClick={onConfirm}>Confirm</PrimaryButton>
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        </ModalActions>
      </ModalContent>
    </ModalBackdrop>
  );
};


const FriendsPage = () => {
  const [data, setData] = useState({ pending: [], sent: [], friends: [] });
  const [modalState, setModalState] = useState({ isOpen: false, item: null, action: null });
  const navigate = useNavigate();

  const refresh = async () => {
    try {
      const { data } = await friendsAPI.getAll();
      setData(data);
    } catch (error) {
      console.error("Failed to fetch friends data:", error);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const openModal = (item, action) => {
    setModalState({ isOpen: true, item, action });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, item: null, action: null });
  };

  const handleConfirm = async () => {
    const { item, action } = modalState;
    if (!item || !action) return;

    try {
      if (action === 'remove') {
        await friendsAPI.remove(item._id);
      } else if (action === 'cancel') {
        await friendsAPI.cancelRequest(item._id);
      }
      refresh();
    } catch (error) {
      console.error(`Failed to ${action} request/friend:`, error);
    } finally {
      closeModal();
    }
  };


  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : name[0].toUpperCase();
  };

  const modalDetails = {
    remove: {
      title: 'Remove Friend',
      message: `Are you sure you want to remove ${modalState.item?.requester?.name || modalState.item?.recipient?.name} from your friends?`,
    },
    cancel: {
      title: 'Cancel Request',
      message: `Are you sure you want to cancel the friend request to ${modalState.item?.recipient?.name}?`,
    },
  };

  return (
    <>
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={handleConfirm}
        title={modalState.action ? modalDetails[modalState.action].title : ''}
        message={modalState.action ? modalDetails[modalState.action].message : ''}
      />
      <Wrapper>
        {/* Pending Requests Card */}
        <Card>
          <CardHeader>Pending Requests</CardHeader>
          <ItemList>
            {(data.pending || []).map(req => (
              <Item key={req._id}>
                <UserInfo>
                  <Avatar>{getInitials(req.requester?.name)}</Avatar>
                  <UserDetails>
                    <UserName>{req.requester?.name}</UserName>
                    <UserEmail>{req.requester?.email}</UserEmail>
                  </UserDetails>
                </UserInfo>
                <Actions>
                  <PrimaryButton onClick={async () => { 
                    try {
                      await friendsAPI.respond(req._id, 'accept'); 
                      refresh(); 
                    } catch (error) {
                      console.error('Failed to accept friend request:', error);
                    }
                  }}>Accept</PrimaryButton>
                  <SecondaryButton onClick={async () => { 
                    try {
                      await friendsAPI.respond(req._id, 'reject'); 
                      refresh(); 
                    } catch (error) {
                      console.error('Failed to reject friend request:', error);
                    }
                  }}>Reject</SecondaryButton>
                </Actions>
              </Item>
            ))}
          </ItemList>
        </Card>

        {/* Sent Requests Card */}
        <Card>
          <CardHeader>Sent Requests</CardHeader>
          <ItemList>
            {(data.sent || []).map(req => (
              <Item key={req._id}>
                <UserInfo>
                  <Avatar>{getInitials(req.recipient?.name)}</Avatar>
                  <UserDetails>
                    <UserName>{req.recipient?.name}</UserName>
                    <UserEmail>{req.recipient?.email}</UserEmail>
                  </UserDetails>
                </UserInfo>
                <Actions>
                  <CancelButton onClick={() => openModal(req, 'cancel')} title="Cancel Request">
                    <X />
                  </CancelButton>
                </Actions>
              </Item>
            ))}
          </ItemList>
        </Card>

        {/* Friends Card */}
        <Card>
          <CardHeader>Friends</CardHeader>
          <ItemList>
            {(data.friends || []).map(f => {
              const other = f.requester?._id === (window?.CURRENT_USER_ID || '') ? f.recipient : f.requester;
              return (
                <Item key={f._id}>
                  <UserInfo>
                    <Avatar>{getInitials(other?.name)}</Avatar>
                    <UserDetails>
                      <UserName>{other?.name}</UserName>
                      <UserEmail>{other?.email}</UserEmail>
                    </UserDetails>
                  </UserInfo>
                  <Actions>
                    <MessageButton onClick={() => navigate(`/messages?userId=${other?._id}`)} title="Send Message">
                      <MessageSquare />
                    </MessageButton>
                    <RemoveButton onClick={() => openModal(f, 'remove')} title="Remove Friend">
                      <UserX />
                    </RemoveButton>
                  </Actions>
                </Item>
              );
            })}
          </ItemList>
        </Card>
      </Wrapper>
    </>
  );
};

export default FriendsPage;