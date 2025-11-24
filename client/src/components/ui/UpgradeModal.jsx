import React from 'react';
import styled, { keyframes } from 'styled-components';
import { X, Crown, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(17, 24, 39, 0.7);
  backdrop-filter: blur(4px);
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  border-radius: 1.5rem;
  width: 100%;
  max-width: 500px;
  position: relative;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: ${slideIn} 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  overflow: hidden;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.5rem;
  border-radius: 9999px;
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.9);
  border: none;
  transition: all 0.2s;
  z-index: 10;

  &:hover {
    background-color: #f3f4f6;
    transform: scale(1.1);
  }
`;

const Header = styled.div`
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  padding: 2rem 1.5rem;
  text-align: center;
  color: white;
`;

const CrownIcon = styled(Crown)`
  margin: 0 auto 1rem;
  color: #fbbf24;
`;

const Title = styled.h2`
  font-size: 1.75rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  opacity: 0.95;
`;

const Body = styled.div`
  padding: 2rem 1.5rem;
`;

const Message = styled.p`
  font-size: 1rem;
  color: #374151;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  color: #1f2937;

  svg {
    color: #10b981;
    flex-shrink: 0;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const Button = styled.button`
  flex: 1;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const UpgradeButton = styled(Button)`
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  color: white;
  box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 8px -1px rgba(79, 70, 229, 0.4);
  }
`;

const CancelButton = styled(Button)`
  background-color: white;
  color: #374151;
  border: 2px solid #e5e7eb;

  &:hover:not(:disabled) {
    background-color: #f9fafb;
    border-color: #d1d5db;
  }
`;

const UpgradeModal = ({ isOpen, onClose, currentLimit, activeBorrows, isPremium }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    navigate('/pricing');
  };

  const isBasicUser = currentLimit === 1;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <X size={20} />
        </CloseButton>

        <Header>
          <CrownIcon size={48} />
          <Title>Borrow Limit Reached</Title>
          <Subtitle>
            {isBasicUser 
              ? 'Unlock more with Premium Verified' 
              : `You've reached your limit of ${currentLimit} books`}
          </Subtitle>
        </Header>

        <Body>
          <Message>
            {isBasicUser ? (
              <>
                You currently have <strong>{activeBorrows}</strong> active borrow{activeBorrows !== 1 ? 's' : ''}.
                <br />
                As a free user, you can only borrow <strong>1 book at a time</strong>.
              </>
            ) : (
              <>
                You have <strong>{activeBorrows}</strong> active borrow{activeBorrows !== 1 ? 's' : ''} out of your <strong>{currentLimit}</strong> book limit.
                <br />
                Please return a book before borrowing another.
              </>
            )}
          </Message>

          {isBasicUser && (
            <>
              <FeaturesList>
                <FeatureItem>
                  <CheckCircle size={20} />
                  <span>Borrow up to <strong>3 books simultaneously</strong></span>
                </FeatureItem>
                <FeatureItem>
                  <CheckCircle size={20} />
                  <span>Priority in borrow request queues</span>
                </FeatureItem>
                <FeatureItem>
                  <CheckCircle size={20} />
                  <span>Extended lending durations</span>
                </FeatureItem>
                <FeatureItem>
                  <CheckCircle size={20} />
                  <span>Verified badge on your profile</span>
                </FeatureItem>
              </FeaturesList>

              <ButtonGroup>
                <CancelButton onClick={onClose}>
                  Maybe Later
                </CancelButton>
                <UpgradeButton onClick={handleUpgrade}>
                  Upgrade to Premium
                </UpgradeButton>
              </ButtonGroup>
            </>
          )}

          {!isBasicUser && (
            <ButtonGroup>
              <UpgradeButton onClick={onClose} style={{ flex: 'none', width: '100%' }}>
                Got It
              </UpgradeButton>
            </ButtonGroup>
          )}
        </Body>
      </ModalContent>
    </ModalOverlay>
  );
};

export default UpgradeModal;
