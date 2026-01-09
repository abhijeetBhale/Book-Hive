import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Plus, Trash2 } from 'lucide-react';
import { versionNotificationService } from '../../utils/versionNotificationAPI';
import toast from 'react-hot-toast';

const VersionNotificationModal = ({ 
  isOpen, 
  onClose, 
  notification = null, 
  onSuccess 
}) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    version: '',
    title: '',
    description: '',
    type: 'minor',
    priority: 'medium',
    releaseDate: new Date().toISOString().split('T')[0],
    targetUsers: ['all'],
    features: [],
    bugFixes: [],
    improvements: [],
    isActive: true
  });

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await versionNotificationService.admin.getAllNotifications();
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setFormData({
      version: '',
      title: '',
      description: '',
      type: 'minor',
      priority: 'medium',
      releaseDate: new Date().toISOString().split('T')[0],
      targetUsers: ['all'],
      features: [],
      bugFixes: [],
      improvements: [],
      isActive: true
    });
    setShowCreateForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.version || !formData.title) {
      toast.error('Please fill in version and title');
      return;
    }

    try {
      await versionNotificationService.admin.createNotification(formData);
      toast.success('Version notification created successfully');
      setShowCreateForm(false);
      fetchNotifications();
      onSuccess();
    } catch (error) {
      console.error('Error creating notification:', error);
      toast.error('Failed to create notification');
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const releaseDate = new Date(date);
    const diffInHours = Math.floor((now - releaseDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return releaseDate.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getVersionBadgeColor = (type) => {
    switch (type) {
      case 'major': return '#000';
      case 'minor': return '#666';
      case 'patch': return '#999';
      default: return '#666';
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Version History</Title>
          <HeaderActions>
            <AddButton onClick={handleCreateNew}>
              <Plus size={16} />
              Add Version
            </AddButton>
            <CloseButton onClick={onClose}>
              <X size={20} />
            </CloseButton>
          </HeaderActions>
        </Header>

        <Content>
          {showCreateForm ? (
            <CreateForm onSubmit={handleSubmit}>
              <FormRow>
                <FormGroup>
                  <Label>Version</Label>
                  <Input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="e.g., v6.1"
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="major">Major</option>
                    <option value="minor">Minor</option>
                    <option value="patch">Patch</option>
                  </Select>
                </FormGroup>
              </FormRow>
              
              <FormGroup>
                <Label>Title</Label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of changes"
                  required
                />
              </FormGroup>

              <FormActions>
                <CancelButton type="button" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </CancelButton>
                <SaveButton type="submit">
                  Create Version
                </SaveButton>
              </FormActions>
            </CreateForm>
          ) : (
            <Timeline>
              {loading ? (
                <LoadingState>Loading version history...</LoadingState>
              ) : notifications.length === 0 ? (
                <EmptyState>
                  <EmptyTitle>No version history yet</EmptyTitle>
                  <EmptyDescription>Create your first version to get started</EmptyDescription>
                </EmptyState>
              ) : (
                notifications.map((notif, index) => (
                  <TimelineItem key={notif._id}>
                    <VersionBadge color={getVersionBadgeColor(notif.type)}>
                      {notif.version}
                    </VersionBadge>
                    <TimelineContent>
                      <VersionTitle>{notif.title}</VersionTitle>
                      <VersionMeta>
                        Admin • {formatTimeAgo(notif.releaseDate)}
                      </VersionMeta>
                      {notif.description && (
                        <VersionDescription>{notif.description}</VersionDescription>
                      )}
                    </TimelineContent>
                    <TimelineLine show={index < notifications.length - 1} />
                  </TimelineItem>
                ))
              )}
            </Timeline>
          )}
        </Content>
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const Modal = styled.div`
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    max-width: 95vw;
    border-radius: 16px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f0f0f0;

  @media (max-width: 768px) {
    padding: 1rem 1.5rem;
  }
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #0056b3;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
    color: #666;
  }
`;

const Content = styled.div`
  padding: 0;
  max-height: 70vh;
  overflow-y: auto;
`;

const Timeline = styled.div`
  padding: 1.5rem 2rem;

  @media (max-width: 768px) {
    padding: 1rem 1.5rem;
  }
`;

const TimelineItem = styled.div`
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding-bottom: 2rem;
`;

const VersionBadge = styled.div`
  background: ${props => props.color};
  color: white;
  border-radius: 20px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  min-width: 60px;
  text-align: center;
  flex-shrink: 0;
`;

const TimelineContent = styled.div`
  flex: 1;
  padding-top: 0.25rem;
`;

const VersionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 0.25rem 0;
  line-height: 1.4;
`;

const VersionMeta = styled.p`
  font-size: 0.875rem;
  color: #999;
  margin: 0 0 0.5rem 0;
`;

const VersionDescription = styled.p`
  font-size: 0.875rem;
  color: #666;
  margin: 0;
  line-height: 1.5;
`;

const TimelineLine = styled.div`
  position: absolute;
  left: 30px;
  top: 60px;
  bottom: -10px;
  width: 2px;
  background: #e0e0e0;
  display: ${props => props.show ? 'block' : 'none'};
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #999;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
`;

const EmptyTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #666;
  margin: 0 0 0.5rem 0;
`;

const EmptyDescription = styled.p`
  color: #999;
  margin: 0;
`;

const CreateForm = styled.form`
  padding: 1.5rem 2rem;
  border-top: 1px solid #f0f0f0;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
`;

const CancelButton = styled.button`
  background: white;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f8f9fa;
    border-color: #adb5bd;
  }
`;

const SaveButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #0056b3;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default VersionNotificationModal;