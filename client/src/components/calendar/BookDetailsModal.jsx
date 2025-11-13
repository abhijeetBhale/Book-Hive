import React from 'react';
import styled from 'styled-components';
import { X, Calendar, Clock, User, Book, MapPin, Phone, Mail, AlertTriangle, CheckCircle } from 'lucide-react';
import { getFullImageUrl } from '../../utils/imageHelpers';
import format from 'date-fns/format';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const BookSection = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
`;

const BookImage = styled.img`
  width: 80px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const BookInfo = styled.div`
  flex: 1;
`;

const BookTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
`;

const BookAuthor = styled.p`
  color: #6b7280;
  margin: 0 0 8px 0;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;

  &.borrowed {
    background: #dbeafe;
    color: #1d4ed8;
  }

  &.approved {
    background: #d1fae5;
    color: #065f46;
  }

  &.overdue {
    background: #fee2e2;
    color: #dc2626;
  }

  &.due-soon {
    background: #fef3c7;
    color: #92400e;
  }
`;

const UserSection = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UserCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  margin-bottom: 12px;
`;

const UserAvatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
`;

const UserDetail = styled.div`
  font-size: 14px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
`;

const DateSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const DateCard = styled.div`
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  text-align: center;
`;

const DateLabel = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
`;

const DateValue = styled.div`
  font-weight: 600;
  color: #111827;
`;

const ActionSection = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
`;

const ActionButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  &.primary {
    background: #3b82f6;
    color: white;

    &:hover {
      background: #2563eb;
    }
  }

  &.secondary {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;

    &:hover {
      background: #e5e7eb;
    }
  }
`;

const BookDetailsModal = ({ event, onClose, currentUser }) => {
  if (!event) return null;

  const { resource } = event;
  const { book, borrower, owner, status, dueDate, createdAt, isLender, daysDiff, lendingDuration, borrowStartDate, borrowEndDate, metadata } = resource;

  const getStatusInfo = () => {
    if (status === 'borrowed' && daysDiff < 0) {
      return {
        class: 'overdue',
        icon: <AlertTriangle size={16} />,
        text: `${Math.abs(daysDiff)} days overdue`
      };
    }
    if (status === 'borrowed' && daysDiff <= 3) {
      return {
        class: 'due-soon',
        icon: <Clock size={16} />,
        text: `Due in ${daysDiff} days`
      };
    }
    if (status === 'approved') {
      return {
        class: 'approved',
        icon: <CheckCircle size={16} />,
        text: 'Approved - Ready for pickup'
      };
    }
    return {
      class: 'borrowed',
      icon: <Book size={16} />,
      text: 'Currently borrowed'
    };
  };

  const statusInfo = getStatusInfo();

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleContactUser = (user) => {
    // This could open a messaging modal or redirect to messages
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <Book size={24} className="text-blue-600" />
            Book Lending Details
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {/* Book Information */}
          <BookSection>
            {book?.coverImage && (
              <BookImage 
                src={getFullImageUrl(book.coverImage)} 
                alt={book.title}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <BookInfo>
              <BookTitle>{book?.title || 'Unknown Book'}</BookTitle>
              <BookAuthor>{book?.author || 'Unknown Author'}</BookAuthor>
              <StatusBadge className={statusInfo.class}>
                {statusInfo.icon}
                {statusInfo.text}
              </StatusBadge>
            </BookInfo>
          </BookSection>

          {/* Lender Information */}
          <UserSection>
            <SectionTitle>
              <User size={20} className="text-green-600" />
              Book Owner (Lender)
            </SectionTitle>
            <UserCard>
              {owner?.avatar && (
                <UserAvatar 
                  src={getFullImageUrl(owner.avatar)} 
                  alt={owner.name}
                  onError={(e) => {
                    e.target.src = '/default-avatar.png';
                  }}
                />
              )}
              <UserInfo>
                <UserName>{owner?.name || 'Unknown User'}</UserName>
                <UserDetail>
                  <Mail size={14} />
                  {owner?.email || 'Email not available'}
                </UserDetail>
                {owner?.location && (
                  <UserDetail>
                    <MapPin size={14} />
                    {owner.location.address || 'Location not specified'}
                  </UserDetail>
                )}
              </UserInfo>
              {!isLender && (
                <ActionButton 
                  className="secondary"
                  onClick={() => handleContactUser(owner)}
                >
                  Contact
                </ActionButton>
              )}
            </UserCard>
          </UserSection>

          {/* Borrower Information */}
          <UserSection>
            <SectionTitle>
              <User size={20} className="text-blue-600" />
              Borrower
            </SectionTitle>
            <UserCard>
              {borrower?.avatar && (
                <UserAvatar 
                  src={getFullImageUrl(borrower.avatar)} 
                  alt={borrower.name}
                  onError={(e) => {
                    e.target.src = '/default-avatar.png';
                  }}
                />
              )}
              <UserInfo>
                <UserName>{borrower?.name || 'Unknown User'}</UserName>
                <UserDetail>
                  <Mail size={14} />
                  {borrower?.email || 'Email not available'}
                </UserDetail>
                {borrower?.location && (
                  <UserDetail>
                    <MapPin size={14} />
                    {borrower.location.address || 'Location not specified'}
                  </UserDetail>
                )}
              </UserInfo>
              {isLender && (
                <ActionButton 
                  className="secondary"
                  onClick={() => handleContactUser(borrower)}
                >
                  Contact
                </ActionButton>
              )}
            </UserCard>
          </UserSection>

          {/* Lending Duration Information */}
          <UserSection>
            <SectionTitle>
              <Clock size={20} className="text-purple-600" />
              Lending Details
            </SectionTitle>
            <UserCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#f3f4f6', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Calendar size={24} className="text-purple-600" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                    Lending Duration: {lendingDuration || book?.lendingDuration || 14} days
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {isLender 
                      ? `You've made this book available for ${lendingDuration || book?.lendingDuration || 14} days`
                      : `This book is available for ${lendingDuration || book?.lendingDuration || 14} days`
                    }
                  </div>
                </div>
              </div>
            </UserCard>
          </UserSection>

          {/* Date Information */}
          <DateSection>
            <DateCard>
              <DateLabel>Request Date</DateLabel>
              <DateValue>{formatDate(createdAt)}</DateValue>
            </DateCard>
            {status === 'borrowed' && metadata?.handoverDate && (
              <DateCard>
                <DateLabel>Borrowing Started</DateLabel>
                <DateValue>{formatDate(metadata.handoverDate)}</DateValue>
              </DateCard>
            )}
            <DateCard>
              <DateLabel>Due Date</DateLabel>
              <DateValue>{formatDate(dueDate || borrowEndDate)}</DateValue>
            </DateCard>
            {status === 'borrowed' && (
              <DateCard>
                <DateLabel>Days Remaining</DateLabel>
                <DateValue style={{ 
                  color: daysDiff < 0 ? '#ef4444' : daysDiff <= 3 ? '#f59e0b' : '#10b981' 
                }}>
                  {daysDiff < 0 ? `${Math.abs(daysDiff)} overdue` : `${daysDiff} days`}
                </DateValue>
              </DateCard>
            )}
          </DateSection>

          {/* Action Buttons */}
          <ActionSection>
            <ActionButton className="secondary" onClick={onClose}>
              Close
            </ActionButton>
            <ActionButton 
              className="primary"
              onClick={() => {
                // Navigate to messages or borrow requests page
                window.location.href = '/messages';
              }}
            >
              Open Messages
            </ActionButton>
          </ActionSection>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default BookDetailsModal;