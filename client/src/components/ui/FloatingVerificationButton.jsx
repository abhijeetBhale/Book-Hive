import React, { useState, useEffect, useContext } from 'react';
import styled, { keyframes } from 'styled-components';
import { CheckCircle, X, Sparkles } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import VerificationPaymentModal from '../profile/VerificationPaymentModal';

const FloatingVerificationButton = () => {
  const { user, fetchProfile } = useContext(AuthContext);
  const [showButton, setShowButton] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user is logged in, not verified, and hasn't dismissed the button
    const dismissed = localStorage.getItem('verificationButtonDismissed');
    
    if (user && !user.isVerified && !dismissed) {
      // Show button after 3 seconds
      const timer = setTimeout(() => {
        setShowButton(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      setShowButton(false);
    }
  }, [user]);

  const handleDismiss = () => {
    setShowButton(false);
    setIsDismissed(true);
    // Remember dismissal for this session only
    localStorage.setItem('verificationButtonDismissed', 'true');
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSuccess = () => {
    setShowModal(false);
    setShowButton(false);
    fetchProfile();
    // Clear dismissal flag
    localStorage.removeItem('verificationButtonDismissed');
  };

  if (!showButton || user?.isVerified) return null;

  return (
    <>
      <FloatingContainer>
        <DismissButton onClick={handleDismiss} title="Dismiss">
          <X size={16} />
        </DismissButton>
        
        <BadgeButton onClick={handleOpenModal}>
          <IconWrapper>
            <Sparkles size={24} />
          </IconWrapper>
          <TextContent>
            <Title>Get Verified!</Title>
            <Subtitle>Stand out with a verified badge</Subtitle>
            <Price>Only ₹50</Price>
          </TextContent>
          <VerifiedIcon>
            <CheckCircle size={32} fill="#3b82f6" color="white" />
          </VerifiedIcon>
        </BadgeButton>
      </FloatingContainer>

      <VerificationPaymentModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </>
  );
};

// Animations
const slideIn = keyframes`
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
`;

const FloatingContainer = styled.div`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 999;
  animation: ${slideIn} 0.5s ease-out;
  
  @media (max-width: 768px) {
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
  }
`;

const DismissButton = styled.button`
  position: absolute;
  top: -8px;
  right: -8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
  z-index: 10;
  
  &:hover {
    background: #dc2626;
    transform: scale(1.1);
  }
`;

const BadgeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 16px;
  border: none;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    background-size: 200% 100%;
    animation: ${shimmer} 3s infinite;
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
    animation: ${pulse} 1s infinite;
  }
  
  @media (max-width: 768px) {
    padding: 0.875rem 1.25rem;
    gap: 0.75rem;
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  flex-shrink: 0;
  
  svg {
    animation: ${pulse} 2s infinite;
  }
  
  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
    
    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

const TextContent = styled.div`
  flex: 1;
  text-align: left;
`;

const Title = styled.div`
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const Subtitle = styled.div`
  font-size: 0.875rem;
  opacity: 0.9;
  margin-bottom: 0.25rem;
  
  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const Price = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.3);
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 6px;
  
  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const VerifiedIcon = styled.div`
  flex-shrink: 0;
  filter: drop-shadow(0 2px 8px rgba(59, 130, 246, 0.5));
  
  @media (max-width: 768px) {
    svg {
      width: 28px;
      height: 28px;
    }
  }
`;

export default FloatingVerificationButton;
