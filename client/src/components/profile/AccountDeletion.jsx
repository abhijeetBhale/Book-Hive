import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Trash2, AlertTriangle, Loader, X, CheckCircle } from 'lucide-react';
import { usersAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const AccountDeletion = ({ user, onAccountDeleted }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionPreview, setDeletionPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Preview, 2: Confirm

  // Fetch deletion preview when modal opens
  useEffect(() => {
    if (showDeleteModal && !deletionPreview) {
      fetchDeletionPreview();
    }
  }, [showDeleteModal]);

  const fetchDeletionPreview = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getDeletionPreview();
      setDeletionPreview(response.data);
    } catch (error) {
      console.error('Error fetching deletion preview:', error);
      toast.error('Failed to load deletion preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    if (!user.googleId && !password) {
      toast.error('Please enter your password');
      return;
    }

    try {
      setLoading(true);
      await usersAPI.deleteAccount({
        password,
        confirmText
      });

      toast.success('Account deleted successfully');
      
      // Call the callback to handle logout
      if (onAccountDeleted) {
        onAccountDeleted();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowDeleteModal(false);
    setStep(1);
    setConfirmText('');
    setPassword('');
    setDeletionPreview(null);
  };

  return (
    <>
      <DangerZone>
        <DangerHeader>
          <AlertTriangle size={24} color="#dc2626" />
          <h3>Danger Zone</h3>
        </DangerHeader>
        
        <DangerContent>
          <DangerDescription>
            <h4>Delete Account</h4>
            <p>
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </DangerDescription>
          
          <DeleteButton onClick={() => setShowDeleteModal(true)}>
            <Trash2 size={18} />
            Delete Account
          </DeleteButton>
        </DangerContent>
      </DangerZone>

      {showDeleteModal && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>
                <AlertTriangle size={24} color="#dc2626" />
                Delete Account
              </h2>
              <CloseButton onClick={closeModal}>
                <X size={24} />
              </CloseButton>
            </ModalHeader>

            {loading && !deletionPreview ? (
              <LoadingContainer>
                <Loader className="spinner" size={32} />
                <p>Loading account data...</p>
              </LoadingContainer>
            ) : (
              <>
                {step === 1 && deletionPreview && (
                  <PreviewStep>
                    {!deletionPreview.canDelete && (
                      <WarningBanner>
                        <AlertTriangle size={20} />
                        <div>
                          <strong>Cannot Delete Account</strong>
                          <p>{deletionPreview.warning}</p>
                        </div>
                      </WarningBanner>
                    )}

                    <SectionTitle>What will be deleted:</SectionTitle>
                    
                    <DataGrid>
                      <DataItem>
                        <DataLabel>Books</DataLabel>
                        <DataValue>{deletionPreview.dataToBeDeleted.books}</DataValue>
                      </DataItem>
                      <DataItem>
                        <DataLabel>Friendships</DataLabel>
                        <DataValue>{deletionPreview.dataToBeDeleted.friendships}</DataValue>
                      </DataItem>
                      <DataItem>
                        <DataLabel>Messages</DataLabel>
                        <DataValue>{deletionPreview.dataToBeDeleted.messages}</DataValue>
                      </DataItem>
                      <DataItem>
                        <DataLabel>Reviews</DataLabel>
                        <DataValue>{deletionPreview.dataToBeDeleted.reviews}</DataValue>
                      </DataItem>
                      <DataItem>
                        <DataLabel>Borrow Requests</DataLabel>
                        <DataValue>{deletionPreview.dataToBeDeleted.totalBorrowRequests}</DataValue>
                      </DataItem>
                      <DataItem>
                        <DataLabel>Club Memberships</DataLabel>
                        <DataValue>{deletionPreview.dataToBeDeleted.clubMemberships}</DataValue>
                      </DataItem>
                    </DataGrid>

                    <ConsequencesList>
                      <SectionTitle>Consequences:</SectionTitle>
                      {deletionPreview.consequences.map((consequence, index) => (
                        <ConsequenceItem key={index}>
                          <CheckCircle size={16} color="#dc2626" />
                          {consequence}
                        </ConsequenceItem>
                      ))}
                    </ConsequencesList>

                    <ModalActions>
                      <CancelButton onClick={closeModal}>Cancel</CancelButton>
                      <ContinueButton 
                        onClick={() => setStep(2)}
                        disabled={!deletionPreview.canDelete}
                      >
                        Continue
                      </ContinueButton>
                    </ModalActions>
                  </PreviewStep>
                )}

                {step === 2 && (
                  <ConfirmStep>
                    <WarningBanner>
                      <AlertTriangle size={20} />
                      <div>
                        <strong>This action is permanent!</strong>
                        <p>All your data will be permanently deleted and cannot be recovered.</p>
                      </div>
                    </WarningBanner>

                    <FormGroup>
                      <Label>Type "DELETE MY ACCOUNT" to confirm:</Label>
                      <Input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="DELETE MY ACCOUNT"
                        autoComplete="off"
                      />
                    </FormGroup>

                    {!user.googleId && (
                      <FormGroup>
                        <Label>Enter your password:</Label>
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Your password"
                          autoComplete="current-password"
                        />
                      </FormGroup>
                    )}

                    <ModalActions>
                      <CancelButton onClick={() => setStep(1)}>Back</CancelButton>
                      <DeleteButtonFinal 
                        onClick={handleDeleteAccount}
                        disabled={loading || confirmText !== 'DELETE MY ACCOUNT' || (!user.googleId && !password)}
                      >
                        {loading ? (
                          <>
                            <Loader className="spinner" size={18} />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 size={18} />
                            Delete My Account
                          </>
                        )}
                      </DeleteButtonFinal>
                    </ModalActions>
                  </ConfirmStep>
                )}
              </>
            )}
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

export default AccountDeletion;

// Styled Components
const DangerZone = styled.div`
  border: 2px solid #dc2626;
  border-radius: 12px;
  padding: 24px;
  margin-top: 32px;
  background: #fef2f2;
`;

const DangerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  h3 {
    color: #dc2626;
    font-size: 20px;
    font-weight: 600;
    margin: 0;
  }
`;

const DangerContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const DangerDescription = styled.div`
  flex: 1;

  h4 {
    color: #1f2937;
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 8px 0;
  }

  p {
    color: #6b7280;
    font-size: 14px;
    margin: 0;
    line-height: 1.5;
  }
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #b91c1c;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;

  h2 {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #1f2937;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  gap: 16px;

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  p {
    color: #6b7280;
    font-size: 14px;
  }
`;

const PreviewStep = styled.div`
  padding: 24px;
`;

const ConfirmStep = styled.div`
  padding: 24px;
`;

const WarningBanner = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  margin-bottom: 24px;

  strong {
    display: block;
    color: #dc2626;
    font-size: 14px;
    margin-bottom: 4px;
  }

  p {
    color: #991b1b;
    font-size: 13px;
    margin: 0;
    line-height: 1.5;
  }
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
`;

const DataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const DataItem = styled.div`
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  text-align: center;
`;

const DataLabel = styled.div`
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
`;

const DataValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #dc2626;
`;

const ConsequencesList = styled.div`
  margin-bottom: 24px;
`;

const ConsequenceItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;

  svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #dc2626;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const CancelButton = styled.button`
  padding: 12px 24px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
  }
`;

const ContinueButton = styled.button`
  padding: 12px 24px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #b91c1c;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DeleteButtonFinal = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  &:hover:not(:disabled) {
    background: #b91c1c;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
