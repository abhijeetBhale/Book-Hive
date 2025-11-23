import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { BadgeCheck, X } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import VerificationPaymentModal from '../profile/VerificationPaymentModal';

const FloatingVerificationButton = () => {
  const { user, fetchProfile } = useContext(AuthContext);
  const navigate = useNavigate();
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
    navigate('/pricing');
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

        <CardContent>
          <IconContainer>
            <BadgeCheck size={40} strokeWidth={2} />
          </IconContainer>

          <Badge>Boost Your Profile</Badge>

          <Title>Get Verified on BookHive</Title>

          <Subtitle>
            Stand out from the crowd with a verified badge and gain more trust from the community.
          </Subtitle>

          <ActionButton onClick={handleOpenModal}>
            Get Verified for ₹50
            <ArrowIcon>→</ArrowIcon>
          </ActionButton>
        </CardContent>
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
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const FloatingContainer = styled.div`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 380px;
  background: linear-gradient(135deg, #a78bfa 0%, #c084fc 100%);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(167, 139, 250, 0.3);
  z-index: 999;
  animation: ${slideIn} 0.5s ease-out;
  
  @media (max-width: 768px) {
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
    width: auto;
    padding: 1.5rem;
  }
`;

const DismissButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: white;
`;

const IconContainer = styled.div`
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
  backdrop-filter: blur(10px);
  
  svg {
    color: white;
  }
`;

const Badge = styled.div`
  background: rgba(255, 255, 255, 0.95);
  color: #7c3aed;
  padding: 0.375rem 1rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const Title = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
  color: white;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const Subtitle = styled.p`
  font-size: 0.9375rem;
  line-height: 1.5;
  margin: 0 0 1.5rem 0;
  color: rgba(255, 255, 255, 0.9);
  
  @media (max-width: 768px) {
    font-size: 0.875rem;
  }
`;

const ActionButton = styled.button`
  width: 100%;
  background: white;
  color: #7c3aed;
  padding: 0.875rem 1.5rem;
  border-radius: 12px;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }
`;

const ArrowIcon = styled.span`
  font-size: 1.25rem;
  transition: transform 0.2s;
  
  ${ActionButton}:hover & {
    transform: translateX(4px);
  }
`;

export default FloatingVerificationButton;
