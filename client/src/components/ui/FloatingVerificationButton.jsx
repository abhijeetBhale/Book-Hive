import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { BadgeCheck, X } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import VerificationPaymentModal from '../profile/VerificationPaymentModal';
import { 
  getVerificationPromptStatus, 
  markFloatingPopupSeen, 
  dismissPermanently,
  resetFloatingPopupFlag
} from '../../utils/verificationPromptAPI';
import toast from 'react-hot-toast';

const FloatingVerificationButton = () => {
  const { user, fetchProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showButton, setShowButton] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDontShowAgain, setShowDontShowAgain] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkShouldShowPopup();
  }, [user]);

  const checkShouldShowPopup = async () => {
    if (!user) {
      setShowButton(false);
      setIsLoading(false);
      return;
    }

    try {
      const response = await getVerificationPromptStatus();
      const { shouldShowFloatingPopup, isVerified } = response.data;

      // Don't show for verified users
      if (isVerified) {
        setShowButton(false);
        setIsLoading(false);
        return;
      }

      // Show popup if conditions are met
      if (shouldShowFloatingPopup) {
        // Show after 3 seconds delay
        setTimeout(() => {
          setShowButton(true);
          setIsLoading(false);
        }, 3000);
      } else {
        setShowButton(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error checking verification prompt status:', error);
      setShowButton(false);
      setIsLoading(false);
    }
  };

  const handleTemporaryDismiss = async () => {
    try {
      // Mark as seen (will show again on next login)
      await markFloatingPopupSeen();
      
      // Reset the flag so it shows on next login
      await resetFloatingPopupFlag();
      
      setShowButton(false);
      toast.success('Reminder will appear on your next login', { icon: '👋' });
    } catch (error) {
      console.error('Error dismissing popup:', error);
      setShowButton(false);
    }
  };

  const handlePermanentDismiss = async () => {
    try {
      await dismissPermanently();
      setShowButton(false);
      toast.success('You won\'t see this reminder again', { icon: '✅' });
    } catch (error) {
      console.error('Error permanently dismissing popup:', error);
      toast.error('Failed to save preference');
    }
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
  };

  if (isLoading || !showButton || user?.isVerified) return null;

  return (
    <>
      <FloatingContainer>
        <DismissButton 
          onClick={handleTemporaryDismiss} 
          title="Remind me later"
          onMouseEnter={() => setShowDontShowAgain(true)}
        >
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
            Get Verified for ₹99
            <ArrowIcon>→</ArrowIcon>
          </ActionButton>

          {/* Don't Show Again Option */}
          {showDontShowAgain && (
            <DontShowAgainContainer>
              <DontShowAgainButton onClick={handlePermanentDismiss}>
                Don't show me again
              </DontShowAgainButton>
            </DontShowAgainContainer>
          )}
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

const DontShowAgainContainer = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  width: 100%;
`;

const DontShowAgainButton = styled.button`
  width: 100%;
  background: transparent;
  color: white;
  padding: 0.625rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.5);
  }
`;

export default FloatingVerificationButton;
