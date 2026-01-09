import React, { useState } from 'react';
import styled from 'styled-components';
import { X, AlertCircle, CreditCard, Building, User } from 'lucide-react';
import toast from 'react-hot-toast';

const WithdrawalModal = ({ isOpen, onClose, walletBalance, onWithdrawalRequest }) => {
  const [amount, setAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const withdrawalAmount = parseFloat(amount);
    
    if (!withdrawalAmount || withdrawalAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (withdrawalAmount > walletBalance) {
      toast.error('Insufficient balance');
      return;
    }
    
    if (withdrawalAmount < 100) {
      toast.error('Minimum withdrawal amount is ₹100');
      return;
    }
    
    if (!bankDetails.accountHolderName || !bankDetails.accountNumber || !bankDetails.ifscCode) {
      toast.error('Please fill all bank details');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onWithdrawalRequest({
        amount: withdrawalAmount,
        bankDetails
      });
      
      toast.success('Withdrawal request submitted successfully!');
      onClose();
      
      // Reset form
      setAmount('');
      setBankDetails({
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        bankName: ''
      });
    } catch (error) {
      toast.error(error.message || 'Failed to submit withdrawal request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Request Withdrawal</Title>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </Header>

        <Content>
          <InfoBox>
            <AlertCircle size={20} />
            <InfoText>
              Withdrawal requests are processed by admin within 2-3 business days. 
              Minimum withdrawal amount is ₹100.
            </InfoText>
          </InfoBox>

          <BalanceInfo>
            <BalanceLabel>Available Balance</BalanceLabel>
            <BalanceAmount>₹{walletBalance.toFixed(2)}</BalanceAmount>
          </BalanceInfo>

          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>Withdrawal Amount</Label>
              <AmountInput
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="100"
                max={walletBalance}
                step="0.01"
                required
              />
              <InputHint>Minimum: ₹100, Maximum: ₹{walletBalance.toFixed(2)}</InputHint>
            </FormGroup>

            <BankDetailsSection>
              <SectionTitle>
                <CreditCard size={20} />
                Bank Account Details
              </SectionTitle>

              <FormGroup>
                <Label>Account Holder Name</Label>
                <Input
                  type="text"
                  value={bankDetails.accountHolderName}
                  onChange={(e) => setBankDetails({...bankDetails, accountHolderName: e.target.value})}
                  placeholder="Full name as per bank account"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Account Number</Label>
                <Input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                  placeholder="Bank account number"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>IFSC Code</Label>
                <Input
                  type="text"
                  value={bankDetails.ifscCode}
                  onChange={(e) => setBankDetails({...bankDetails, ifscCode: e.target.value.toUpperCase()})}
                  placeholder="IFSC Code (e.g., SBIN0001234)"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Bank Name (Optional)</Label>
                <Input
                  type="text"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                  placeholder="Bank name"
                />
              </FormGroup>
            </BankDetailsSection>

            <Actions>
              <CancelButton type="button" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </CancelButton>
              <SubmitButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Request Withdrawal'}
              </SubmitButton>
            </Actions>
          </Form>
        </Content>
      </Modal>
    </Overlay>
  );
};

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
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #f1f5f9;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const CloseButton = styled.button`
  background: #f8fafc;
  border: none;
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;

  &:hover {
    background: #e2e8f0;
    color: #475569;
  }
`;

const Content = styled.div`
  padding: 1.5rem;
`;

const InfoBox = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  margin-bottom: 1.5rem;
`;

const InfoText = styled.p`
  font-size: 0.875rem;
  color: #92400e;
  margin: 0;
  line-height: 1.5;
`;

const BalanceInfo = styled.div`
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const BalanceLabel = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 0.25rem 0;
`;

const BalanceAmount = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #10B981;
  margin: 0;
`;

const Form = styled.form`
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
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #10B981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }
`;

const AmountInput = styled(Input)`
  font-size: 1.125rem;
  font-weight: 500;
`;

const InputHint = styled.p`
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
`;

const BankDetailsSection = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
`;

const SectionTitle = styled.h4`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
  margin: 0 0 1rem 0;
`;

const Actions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-weight: 500;
  color: #374151;
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
  flex: 2;
  padding: 0.75rem 1.5rem;
  background: #10B981;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

export default WithdrawalModal;