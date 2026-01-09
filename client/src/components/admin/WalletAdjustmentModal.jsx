import React, { useState } from 'react';
import styled from 'styled-components';
import { X, DollarSign, AlertTriangle, CheckCircle, User } from 'lucide-react';
import toast from 'react-hot-toast';

const WalletAdjustmentModal = ({ isOpen, onClose, user, onAdjustment }) => {
  const [formData, setFormData] = useState({
    type: 'credit',
    amount: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.reason) {
      toast.error('Please fill all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (formData.type === 'debit' && user.wallet?.balance < amount) {
      toast.error('Insufficient balance for debit adjustment');
      return;
    }

    setLoading(true);
    try {
      await onAdjustment({
        userId: user._id,
        type: formData.type,
        amount,
        reason: formData.reason
      });
      
      toast.success(`Wallet ${formData.type}ed successfully`);
      onClose();
      setFormData({ type: 'credit', amount: '', reason: '' });
    } catch (error) {
      toast.error(error.message || 'Failed to adjust wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <HeaderContent>
            <Title>Adjust Wallet Balance</Title>
            <Subtitle>Make manual adjustments to user's wallet</Subtitle>
          </HeaderContent>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </Header>

        <Content>
          {/* User Info */}
          <UserSection>
            <UserAvatar>
              <User size={24} />
            </UserAvatar>
            <UserInfo>
              <UserName>{user.name}</UserName>
              <UserEmail>{user.email}</UserEmail>
              <UserBalance>
                Current Balance: ₹{user.wallet?.balance?.toFixed(2) || '0.00'}
              </UserBalance>
            </UserInfo>
          </UserSection>

          {/* Warning */}
          <WarningBox>
            <AlertTriangle size={20} />
            <WarningText>
              <strong>Important:</strong> Manual wallet adjustments should only be made for 
              legitimate reasons such as refunds, corrections, or customer service resolutions. 
              All adjustments are logged and auditable.
            </WarningText>
          </WarningBox>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <FormSection>
              <FormGroup>
                <Label>Adjustment Type</Label>
                <TypeSelector>
                  <TypeOption 
                    $active={formData.type === 'credit'}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'credit' }))}
                    type="credit"
                  >
                    <CheckCircle size={16} />
                    Credit (Add Money)
                  </TypeOption>
                  <TypeOption 
                    $active={formData.type === 'debit'}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'debit' }))}
                    type="debit"
                  >
                    <DollarSign size={16} />
                    Debit (Remove Money)
                  </TypeOption>
                </TypeSelector>
              </FormGroup>

              <FormGroup>
                <Label>Amount (₹)</Label>
                <AmountInput
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  min="0.01"
                  step="0.01"
                  required
                />
                {formData.type === 'debit' && formData.amount && (
                  <AmountWarning>
                    {parseFloat(formData.amount) > (user.wallet?.balance || 0) && (
                      <span className="error">
                        ⚠️ Amount exceeds current balance
                      </span>
                    )}
                  </AmountWarning>
                )}
              </FormGroup>

              <FormGroup>
                <Label>Reason for Adjustment</Label>
                <ReasonTextarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Provide a detailed reason for this adjustment (required for audit trail)"
                  rows={4}
                  required
                />
                <CharacterCount>
                  {formData.reason.length}/500 characters
                </CharacterCount>
              </FormGroup>

              {/* Preview */}
              {formData.amount && (
                <PreviewSection>
                  <PreviewTitle>Adjustment Preview</PreviewTitle>
                  <PreviewGrid>
                    <PreviewItem>
                      <PreviewLabel>Current Balance</PreviewLabel>
                      <PreviewValue>₹{user.wallet?.balance?.toFixed(2) || '0.00'}</PreviewValue>
                    </PreviewItem>
                    <PreviewItem>
                      <PreviewLabel>Adjustment</PreviewLabel>
                      <PreviewValue type={formData.type}>
                        {formData.type === 'credit' ? '+' : '-'}₹{parseFloat(formData.amount || 0).toFixed(2)}
                      </PreviewValue>
                    </PreviewItem>
                    <PreviewItem>
                      <PreviewLabel>New Balance</PreviewLabel>
                      <PreviewValue>
                        ₹{(
                          (user.wallet?.balance || 0) + 
                          (formData.type === 'credit' ? 1 : -1) * parseFloat(formData.amount || 0)
                        ).toFixed(2)}
                      </PreviewValue>
                    </PreviewItem>
                  </PreviewGrid>
                </PreviewSection>
              )}
            </FormSection>

            <Footer>
              <CancelButton type="button" onClick={onClose} disabled={loading}>
                Cancel
              </CancelButton>
              <SubmitButton 
                type="submit" 
                disabled={loading || !formData.amount || !formData.reason}
                adjustmentType={formData.type}
              >
                {loading ? 'Processing...' : `${formData.type === 'credit' ? 'Credit' : 'Debit'} Wallet`}
              </SubmitButton>
            </Footer>
          </form>
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
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
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
  margin: 0 0 0.25rem 0;
`;

const Subtitle = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
`;

const CloseButton = styled.button`
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 1.5rem;
`;

const UserAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
`;

const UserEmail = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.25rem 0;
`;

const UserBalance = styled.p`
  font-size: 0.875rem;
  font-weight: 600;
  color: #059669;
  margin: 0;
`;

const WarningBox = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  margin-bottom: 1.5rem;
`;

const WarningText = styled.p`
  font-size: 0.875rem;
  color: #92400e;
  margin: 0;
  line-height: 1.5;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const TypeSelector = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const TypeOption = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 2px solid ${props => props.$active ? 
    (props.type === 'credit' ? '#10b981' : '#ef4444') : '#e5e7eb'};
  border-radius: 8px;
  background: ${props => props.$active ? 
    (props.type === 'credit' ? '#ecfdf5' : '#fef2f2') : 'white'};
  color: ${props => props.$active ? 
    (props.type === 'credit' ? '#065f46' : '#991b1b') : '#6b7280'};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  type: button;

  &:hover {
    border-color: ${props => props.type === 'credit' ? '#10b981' : '#ef4444'};
    background: ${props => props.type === 'credit' ? '#ecfdf5' : '#fef2f2'};
    color: ${props => props.type === 'credit' ? '#065f46' : '#991b1b'};
  }
`;

const AmountInput = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const AmountWarning = styled.div`
  font-size: 0.75rem;
  margin-top: 0.25rem;

  .error {
    color: #dc2626;
  }
`;

const ReasonTextarea = styled.textarea`
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const CharacterCount = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  text-align: right;
`;

const PreviewSection = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
`;

const PreviewTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1rem 0;
`;

const PreviewGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
`;

const PreviewItem = styled.div`
  text-align: center;
`;

const PreviewLabel = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0 0 0.25rem 0;
`;

const PreviewValue = styled.p`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => {
    if (props.type === 'credit') return '#16a34a';
    if (props.type === 'debit') return '#dc2626';
    return '#111827';
  }};
  margin: 0;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  margin: 2rem -2rem -2rem -2rem;
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 8px;
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

const SubmitButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: ${props => props.adjustmentType === 'credit' ? '#16a34a' : '#dc2626'};
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${props => props.adjustmentType === 'credit' ? '#15803d' : '#b91c1c'};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

export default WalletAdjustmentModal;