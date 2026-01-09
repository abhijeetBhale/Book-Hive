import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Users,
  Sparkles,
  Bug,
  Zap,
  AlertCircle,
  Star,
  Info,
  RefreshCw,
  X
} from 'lucide-react';
import { versionNotificationService } from '../../utils/versionNotificationAPI';
import VersionNotificationModal from './VersionNotificationModal';
import toast from 'react-hot-toast';

const VersionNotificationsTab = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [viewingNotification, setViewingNotification] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await versionNotificationService.admin.getAllNotifications();
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      await versionNotificationService.admin.deleteNotification(id);
      toast.success('Notification deleted successfully');
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleModalSuccess = () => {
    fetchNotifications();
    setShowCreateModal(false);
    setEditingNotification(null);
  };

  const handleViewNotification = (notification) => {
    setViewingNotification(notification);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'major': return <Star size={16} />;
      case 'minor': return <Sparkles size={16} />;
      case 'patch': return <Zap size={16} />;
      case 'hotfix': return <AlertCircle size={16} />;
      default: return <Info size={16} />;
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <LoadingContainer>
        <RefreshCw className="animate-spin" size={24} />
        <p>Loading version notifications...</p>
      </LoadingContainer>
    );
  }

  return (
    <Container>
      <Header>
        <HeaderContent>
          <Title>Version Notifications</Title>
          <Description>
            Manage version update notifications that users see when new features are released
          </Description>
        </HeaderContent>
        <HeaderActions>
          <RefreshButton onClick={fetchNotifications}>
            <RefreshCw size={16} />
            Refresh
          </RefreshButton>
          <CreateButton onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Version History
          </CreateButton>
        </HeaderActions>
      </Header>

      <Content>
        {notifications.length === 0 ? (
          <EmptyState>
            <Sparkles size={48} className="text-gray-300" />
            <EmptyTitle>No Version Notifications</EmptyTitle>
            <EmptyDescription>
              Create your first version notification to inform users about new features and updates
            </EmptyDescription>
            <CreateButton onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              Version History
            </CreateButton>
          </EmptyState>
        ) : (
          <NotificationGrid>
            {notifications.map((notification) => (
              <NotificationCard key={notification._id}>
                <CardHeader>
                  <VersionBadge type={notification.type}>
                    {getTypeIcon(notification.type)}
                    <span>{notification.version}</span>
                  </VersionBadge>
                  <PriorityBadge priority={notification.priority}>
                    {notification.priority}
                  </PriorityBadge>
                </CardHeader>

                <CardContent>
                  <NotificationTitle>{notification.title}</NotificationTitle>
                  <NotificationDescription>
                    {notification.description}
                  </NotificationDescription>

                  <MetaInfo>
                    <MetaItem>
                      <Calendar size={14} />
                      <span>{formatDate(notification.releaseDate)}</span>
                    </MetaItem>
                    <MetaItem>
                      <Users size={14} />
                      <span>{notification.targetUsers.join(', ')}</span>
                    </MetaItem>
                  </MetaInfo>

                  <FeatureStats>
                    {notification.features?.length > 0 && (
                      <StatItem>
                        <Sparkles size={14} />
                        <span>{notification.features.length} features</span>
                      </StatItem>
                    )}
                    {notification.bugFixes?.length > 0 && (
                      <StatItem>
                        <Bug size={14} />
                        <span>{notification.bugFixes.length} fixes</span>
                      </StatItem>
                    )}
                    {notification.improvements?.length > 0 && (
                      <StatItem>
                        <Zap size={14} />
                        <span>{notification.improvements.length} improvements</span>
                      </StatItem>
                    )}
                  </FeatureStats>
                </CardContent>

                <CardActions>
                  <ActionButton onClick={() => setViewingNotification(notification)}>
                    <Eye size={16} />
                    View
                  </ActionButton>
                  <ActionButton onClick={() => setEditingNotification(notification)}>
                    <Edit size={16} />
                    Edit
                  </ActionButton>
                  <DeleteButton onClick={() => handleDeleteNotification(notification._id)}>
                    <Trash2 size={16} />
                    Delete
                  </DeleteButton>
                </CardActions>

                <StatusIndicator active={notification.isActive} />
              </NotificationCard>
            ))}
          </NotificationGrid>
        )}
      </Content>

      {/* Version History Modal */}
      <VersionNotificationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleModalSuccess}
      />

      {/* View Modal */}
      {viewingNotification && (
        <ViewModal onClick={() => setViewingNotification(null)}>
          <ViewModalContent onClick={(e) => e.stopPropagation()}>
            <ViewModalHeader>
              <ViewModalTitle>
                {getTypeIcon(viewingNotification.type)}
                {viewingNotification.version} - {viewingNotification.title}
              </ViewModalTitle>
              <CloseButton onClick={() => setViewingNotification(null)}>
                <X size={20} />
              </CloseButton>
            </ViewModalHeader>
            
            <ViewModalBody>
              <ViewDescription>{viewingNotification.description}</ViewDescription>
              
              {viewingNotification.features?.length > 0 && (
                <ViewSection>
                  <ViewSectionTitle>
                    <Sparkles size={16} />
                    New Features
                  </ViewSectionTitle>
                  <ViewList>
                    {viewingNotification.features.map((feature, index) => (
                      <ViewListItem key={index}>{feature}</ViewListItem>
                    ))}
                  </ViewList>
                </ViewSection>
              )}

              {viewingNotification.bugFixes?.length > 0 && (
                <ViewSection>
                  <ViewSectionTitle>
                    <Bug size={16} />
                    Bug Fixes
                  </ViewSectionTitle>
                  <ViewList>
                    {viewingNotification.bugFixes.map((fix, index) => (
                      <ViewListItem key={index}>{fix}</ViewListItem>
                    ))}
                  </ViewList>
                </ViewSection>
              )}

              {viewingNotification.improvements?.length > 0 && (
                <ViewSection>
                  <ViewSectionTitle>
                    <Zap size={16} />
                    Improvements
                  </ViewSectionTitle>
                  <ViewList>
                    {viewingNotification.improvements.map((improvement, index) => (
                      <ViewListItem key={index}>{improvement}</ViewListItem>
                    ))}
                  </ViewList>
                </ViewSection>
              )}
            </ViewModalBody>
          </ViewModalContent>
        </ViewModal>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const HeaderContent = styled.div``;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
`;

const Description = styled.p`
  color: #6b7280;
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #4338ca;
  }
`;

const Content = styled.div`
  padding: 2rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
  
  p {
    margin: 1rem 0 0 0;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
`;

const EmptyTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 1rem 0 0.5rem 0;
`;

const EmptyDescription = styled.p`
  color: #6b7280;
  margin: 0 0 2rem 0;
  max-width: 400px;
`;

const NotificationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
`;

const NotificationCard = styled.div`
  position: relative;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const VersionBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f3f4f6;
  color: #374151;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
`;

const PriorityBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  background: ${props => {
    switch (props.priority) {
      case 'critical': return '#fee2e2';
      case 'high': return '#fed7aa';
      case 'medium': return '#dbeafe';
      case 'low': return '#dcfce7';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.priority) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#2563eb';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  }};
`;

const CardContent = styled.div`
  margin-bottom: 1.5rem;
`;

const NotificationTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
`;

const NotificationDescription = styled.p`
  color: #6b7280;
  margin: 0 0 1rem 0;
  line-height: 1.5;
`;

const MetaInfo = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

const FeatureStats = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
`;

const CardActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
  }
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #fecaca;
  }
`;

const StatusIndicator = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.active ? '#16a34a' : '#6b7280'};
`;

// View Modal Styled Components
const ViewModal = styled.div`
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
  padding: 1rem;
`;

const ViewModalContent = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ViewModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const ViewModalTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const ViewModalBody = styled.div`
  padding: 1.5rem;
`;

const ViewDescription = styled.p`
  color: #374151;
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
`;

const ViewSection = styled.div`
  margin-bottom: 1.5rem;
`;

const ViewSectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
`;

const ViewList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ViewListItem = styled.li`
  background: #f9fafb;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  margin-bottom: 0.5rem;
  color: #374151;

  &:last-child {
    margin-bottom: 0;
  }
`;

export default VersionNotificationsTab;