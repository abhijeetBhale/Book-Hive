import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { BadgeCheck, X } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { 
  getVerificationPromptStatus, 
  dismissPermanently 
} from '../../utils/verificationPromptAPI';
import toast from 'react-hot-toast';

const VerificationNotification = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [shouldShow, setShouldShow] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkShouldShowNotification();
  }, [user]);

  const checkShouldShowNotification = async () => {
    if (!user) {
      setShouldShow(false);
      setIsLoading(false);
      return;
    }

    try {
      const response = await getVerificationPromptStatus();
      const { shouldShowNotification, isVerified } = response.data;

      // Show notification for unverified users who haven't permanently dismissed
      setShouldShow(shouldShowNotification && !isVerified);
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking verification notification status:', error);
      setShouldShow(false);
      setIsLoading(false);
    }
  };

  const handleDismiss = async () => {
    try {
      await dismissPermanently();
      setShouldShow(false);
      toast.success('Verification reminder dismissed', { icon: '✅' });
    } catch (error) {
      console.error('Error dismissing notification:', error);
      toast.error('Failed to dismiss notification');
    }
  };

  const handleGetVerified = () => {
    navigate('/get-verified');
  };

  if (isLoading || !shouldShow || user?.isVerified) return null;

  return (
    <NotificationCard>
      <DismissButton onClick={handleDismiss} title="Don't show again">
        <X size={14} />
      </DismissButton>

      <NotificationContent>
        <IconBadge>
          <BadgeCheck size={20} strokeWidth={2.5} />
        </IconBadge>

        <TextContent>
          <Title>Get Verified on BookHive</Title>
          <Description>
            Stand out with a verified badge and gain more trust from the community.
          </Description>
        </TextContent>
      </NotificationContent>

      <ActionButton onClick={handleGetVerified}>
        Get Verified
      </ActionButton>

      <SpecialBadge>Recommended</SpecialBadge>
    </NotificationCard>
  );
};

const NotificationCard = styled.div`
  position: relative;
  background: linear-gradient(135deg, #f0e7ff 0%, #e9d5ff 100%);
  border: 2px solid #a78bfa;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 4px 12px rgba(167, 139, 250, 0.15);
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 6px 16px rgba(167, 139, 250, 0.25);
    transform: translateY(-2px);
  }
`;

const DismissButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(124, 58, 237, 0.1);
  color: #7c3aed;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;

  &:hover {
    background: rgba(124, 58, 237, 0.2);
  }
`;

const NotificationContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const IconBadge = styled.div`
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #a78bfa 0%, #c084fc 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    color: white;
  }
`;

const TextContent = styled.div`
  flex: 1;
  padding-right: 1.5rem;
`;

const Title = styled.h4`
  font-size: 0.9375rem;
  font-weight: 700;
  color: #7c3aed;
  margin: 0 0 0.25rem 0;
`;

const Description = styled.p`
  font-size: 0.8125rem;
  line-height: 1.4;
  color: #6b21a8;
  margin: 0;
`;

const ActionButton = styled.button`
  width: 100%;
  background: linear-gradient(135deg, #a78bfa 0%, #c084fc 100%);
  color: white;
  padding: 0.625rem 1rem;
  border-radius: 8px;
  border: none;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(167, 139, 250, 0.3);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(167, 139, 250, 0.4);
  }
`;

const SpecialBadge = styled.div`
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.4);
`;

export default VerificationNotification;
