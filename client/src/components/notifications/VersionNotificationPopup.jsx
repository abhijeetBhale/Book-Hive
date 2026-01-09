import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  X, 
  Sparkles, 
  Bug, 
  Zap, 
  Calendar,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Info,
  Star
} from 'lucide-react';
import { versionNotificationService } from '../../utils/versionNotificationAPI';
import toast from 'react-hot-toast';

const VersionNotificationPopup = ({ isOpen, onClose, notification }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !notification) return null;

  const handleMarkAsViewed = async (action = 'viewed') => {
    try {
      setLoading(true);
      await versionNotificationService.markAsViewed(notification._id, action);
      onClose();
    } catch (error) {
      console.error('Error marking notification as viewed:', error);
      toast.error('Failed to mark notification as viewed');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#2563eb';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'major': return <Star size={20} />;
      case 'minor': return <Sparkles size={20} />;
      case 'patch': return <Zap size={20} />;
      case 'hotfix': return <AlertCircle size={20} />;
      default: return <Info size={20} />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Overlay onClick={() => handleMarkAsViewed('dismissed')}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <HeaderContent>
            <VersionBadge type={notification.type} priority={notification.priority}>
              {getTypeIcon(notification.type)}
              <span>{notification.version}</span>
            </VersionBadge>
            <Title>{notification.title}</Title>
            <Description>{notification.description}</Description>
            <ReleaseDate>
              <Calendar size={16} />
              Released on {formatDate(notification.releaseDate)}
            </ReleaseDate>
          </HeaderContent>
          <CloseButton onClick={() => handleMarkAsViewed('closed')} disabled={loading}>
            <X size={24} />
          </CloseButton>
        </Header>

        <Content>
          {/* Main Content */}
          {notification.content && (
            <Section>
              <SectionTitle>What's New</SectionTitle>
              <ContentText dangerouslySetInnerHTML={{ __html: notification.content }} />
            </Section>
          )}

          {/* New Features */}
          {notification.features && notification.features.length > 0 && (
            <Section>
              <SectionTitle>
                <Sparkles size={18} />
                New Features
              </SectionTitle>
              <FeatureList>
                {notification.features.map((feature, index) => (
                  <FeatureItem key={index}>
                    <FeatureIcon>{feature.icon || '✨'}</FeatureIcon>
                    <FeatureContent>
                      <FeatureTitle>{feature.title}</FeatureTitle>
                      <FeatureDescription>{feature.description}</FeatureDescription>
                    </FeatureContent>
                  </FeatureItem>
                ))}
              </FeatureList>
            </Section>
          )}

          {/* Bug Fixes */}
          {notification.bugFixes && notification.bugFixes.length > 0 && (
            <Section>
              <SectionTitle>
                <Bug size={18} />
                Bug Fixes
              </SectionTitle>
              <BugFixList>
                {notification.bugFixes.map((fix, index) => (
                  <BugFixItem key={index}>
                    <CheckCircle size={16} />
                    <BugFixContent>
                      <BugFixTitle>{fix.title}</BugFixTitle>
                      <BugFixDescription>{fix.description}</BugFixDescription>
                    </BugFixContent>
                  </BugFixItem>
                ))}
              </BugFixList>
            </Section>
          )}

          {/* Improvements */}
          {notification.improvements && notification.improvements.length > 0 && (
            <Section>
              <SectionTitle>
                <Zap size={18} />
                Improvements
              </SectionTitle>
              <ImprovementList>
                {notification.improvements.map((improvement, index) => (
                  <ImprovementItem key={index}>
                    <ChevronRight size={16} />
                    <ImprovementContent>
                      <ImprovementTitle>{improvement.title}</ImprovementTitle>
                      <ImprovementDescription>{improvement.description}</ImprovementDescription>
                    </ImprovementContent>
                  </ImprovementItem>
                ))}
              </ImprovementList>
            </Section>
          )}
        </Content>

        <Footer>
          <FooterText>
            Thank you for using BookHive! We're constantly working to improve your experience.
          </FooterText>
          <ActionButtons>
            <SecondaryButton 
              onClick={() => handleMarkAsViewed('dismissed')}
              disabled={loading}
            >
              Maybe Later
            </SecondaryButton>
            <PrimaryButton 
              onClick={() => handleMarkAsViewed('viewed')}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Got it!'}
            </PrimaryButton>
          </ActionButtons>
        </Footer>
      </Modal>
    </Overlay>
  );
};

// Styled Components
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
  backdrop-filter: blur(4px);
`;

const Modal = styled.div`
  background: white;
  border-radius: 20px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const VersionBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
`;

const Title = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
`;

const Description = styled.p`
  font-size: 1rem;
  opacity: 0.9;
  margin: 0 0 1rem 0;
  line-height: 1.5;
`;

const ReleaseDate = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  opacity: 0.8;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
`;

const Section = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f1f5f9;

  &:last-child {
    border-bottom: none;
  }
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1rem 0;
`;

const ContentText = styled.div`
  color: #475569;
  line-height: 1.6;

  p {
    margin: 0 0 1rem 0;
  }

  ul, ol {
    margin: 0 0 1rem 0;
    padding-left: 1.5rem;
  }

  li {
    margin-bottom: 0.5rem;
  }
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
  border-left: 4px solid #3b82f6;
`;

const FeatureIcon = styled.div`
  font-size: 1.5rem;
  flex-shrink: 0;
`;

const FeatureContent = styled.div`
  flex: 1;
`;

const FeatureTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
`;

const FeatureDescription = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
`;

const BugFixList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const BugFixItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: #16a34a;
`;

const BugFixContent = styled.div`
  flex: 1;
`;

const BugFixTitle = styled.h5`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
`;

const BugFixDescription = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
`;

const ImprovementList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ImprovementItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: #f59e0b;
`;

const ImprovementContent = styled.div`
  flex: 1;
`;

const ImprovementTitle = styled.h5`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
`;

const ImprovementDescription = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
`;

const Footer = styled.div`
  padding: 1.5rem 2rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
`;

const FooterText = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 1rem 0;
  text-align: center;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const SecondaryButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: white;
  color: #64748b;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

export default VersionNotificationPopup;