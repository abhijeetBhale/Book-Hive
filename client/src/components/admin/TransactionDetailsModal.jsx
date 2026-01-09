import React from 'react';
import styled from 'styled-components';
import { 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  User, 
  Calendar, 
  DollarSign, 
  FileText, 
  CreditCard, 
  Building,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

const TransactionDetailsModal = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'rejected':
        return <XCircle size={20} className="text-red-500" />;
      case 'pending':
        return <Clock size={20} className="text-yellow-500" />;
      default:
        return <AlertCircle size={20} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSourceLabel = (source) => {
    const labels = {
      lending_fee: 'Lending Fee',
      book_sale: 'Book Sale',
      platform_commission: 'Platform Commission',
      withdrawal: 'Withdrawal',
      refund: 'Refund',
      penalty: 'Penalty'
    };
    return labels[source] || source;
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <div className="flex items-center gap-3">
            <TransactionIcon type={transaction.type}>
              {transaction.type === 'credit' ? (
                <ArrowUpRight size={24} />
              ) : (
                <ArrowDownLeft size={24} />
              )}
            </TransactionIcon>
            <div>
              <Title>Transaction Details</Title>
              <Subtitle>{getSourceLabel(transaction.source)}</Subtitle>
            </div>
          </div>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </Header>

        <Content>
          {/* Transaction Overview */}
          <Section>
            <SectionTitle>
              <DollarSign size={18} />
              Transaction Overview
            </SectionTitle>
            <OverviewGrid>
              <OverviewCard>
                <OverviewLabel>Amount</OverviewLabel>
                <OverviewValue type={transaction.type}>
                  {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount?.toFixed(2)}
                </OverviewValue>
              </OverviewCard>
              <OverviewCard>
                <OverviewLabel>Type</OverviewLabel>
                <OverviewValue>
                  <TypeBadge type={transaction.type}>
                    {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                  </TypeBadge>
                </OverviewValue>
              </OverviewCard>
              <OverviewCard>
                <OverviewLabel>Balance After</OverviewLabel>
                <OverviewValue>₹{transaction.balanceAfter?.toFixed(2)}</OverviewValue>
              </OverviewCard>
              <OverviewCard>
                <OverviewLabel>Transaction ID</OverviewLabel>
                <OverviewValue>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{transaction._id}</span>
                    <CopyButton onClick={() => copyToClipboard(transaction._id, 'Transaction ID')}>
                      <Copy size={14} />
                    </CopyButton>
                  </div>
                </OverviewValue>
              </OverviewCard>
            </OverviewGrid>
          </Section>

          {/* User Information */}
          <Section>
            <SectionTitle>
              <User size={18} />
              User Information
            </SectionTitle>
            <UserInfo>
              <UserAvatar>
                <User size={24} />
              </UserAvatar>
              <UserDetails>
                <UserName>{transaction.userId?.name || 'Unknown User'}</UserName>
                <UserEmail>{transaction.userId?.email || 'No email'}</UserEmail>
                {transaction.userId?.phone && (
                  <UserPhone>{transaction.userId.phone}</UserPhone>
                )}
              </UserDetails>
            </UserInfo>
          </Section>

          {/* Transaction Details */}
          <Section>
            <SectionTitle>
              <FileText size={18} />
              Transaction Details
            </SectionTitle>
            <DetailsList>
              <DetailItem>
                <DetailLabel>Description</DetailLabel>
                <DetailValue>{transaction.description}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Source</DetailLabel>
                <DetailValue>
                  <SourceBadge source={transaction.source}>
                    {getSourceLabel(transaction.source)}
                  </SourceBadge>
                </DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Reference Type</DetailLabel>
                <DetailValue>{transaction.referenceType}</DetailValue>
              </DetailItem>
              {transaction.referenceId && (
                <DetailItem>
                  <DetailLabel>Reference ID</DetailLabel>
                  <DetailValue>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{transaction.referenceId}</span>
                      <CopyButton onClick={() => copyToClipboard(transaction.referenceId, 'Reference ID')}>
                        <Copy size={14} />
                      </CopyButton>
                    </div>
                  </DetailValue>
                </DetailItem>
              )}
              <DetailItem>
                <DetailLabel>Created At</DetailLabel>
                <DetailValue>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    {formatDate(transaction.createdAt)}
                  </div>
                </DetailValue>
              </DetailItem>
            </DetailsList>
          </Section>

          {/* Withdrawal Specific Information */}
          {transaction.source === 'withdrawal' && transaction.metadata && (
            <Section>
              <SectionTitle>
                <CreditCard size={18} />
                Withdrawal Information
              </SectionTitle>
              
              {/* Status */}
              <StatusContainer>
                <StatusBadge className={getStatusColor(transaction.metadata.status)}>
                  {getStatusIcon(transaction.metadata.status)}
                  <span className="capitalize">{transaction.metadata.status}</span>
                </StatusBadge>
              </StatusContainer>

              {/* Bank Details */}
              {transaction.metadata.bankDetails && (
                <BankDetails>
                  <BankDetailItem>
                    <DetailLabel>Account Holder</DetailLabel>
                    <DetailValue>{transaction.metadata.bankDetails.accountHolderName}</DetailValue>
                  </BankDetailItem>
                  <BankDetailItem>
                    <DetailLabel>Account Number</DetailLabel>
                    <DetailValue>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">
                          {transaction.metadata.bankDetails.accountNumber?.replace(/(.{4})/g, '$1 ')}
                        </span>
                        <CopyButton onClick={() => copyToClipboard(transaction.metadata.bankDetails.accountNumber, 'Account Number')}>
                          <Copy size={14} />
                        </CopyButton>
                      </div>
                    </DetailValue>
                  </BankDetailItem>
                  <BankDetailItem>
                    <DetailLabel>IFSC Code</DetailLabel>
                    <DetailValue>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{transaction.metadata.bankDetails.ifscCode}</span>
                        <CopyButton onClick={() => copyToClipboard(transaction.metadata.bankDetails.ifscCode, 'IFSC Code')}>
                          <Copy size={14} />
                        </CopyButton>
                      </div>
                    </DetailValue>
                  </BankDetailItem>
                  {transaction.metadata.bankDetails.bankName && (
                    <BankDetailItem>
                      <DetailLabel>Bank Name</DetailLabel>
                      <DetailValue>{transaction.metadata.bankDetails.bankName}</DetailValue>
                    </BankDetailItem>
                  )}
                </BankDetails>
              )}

              {/* Admin Actions */}
              {transaction.metadata.approvedBy && (
                <AdminAction>
                  <DetailLabel>Approved By</DetailLabel>
                  <DetailValue>Admin • {formatDate(transaction.metadata.approvedAt)}</DetailValue>
                  {transaction.metadata.adminNotes && (
                    <AdminNotes>{transaction.metadata.adminNotes}</AdminNotes>
                  )}
                </AdminAction>
              )}

              {transaction.metadata.rejectedBy && (
                <AdminAction>
                  <DetailLabel>Rejected By</DetailLabel>
                  <DetailValue>Admin • {formatDate(transaction.metadata.rejectedAt)}</DetailValue>
                  {transaction.metadata.adminNotes && (
                    <AdminNotes>{transaction.metadata.adminNotes}</AdminNotes>
                  )}
                </AdminAction>
              )}
            </Section>
          )}

          {/* Metadata */}
          {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
            <Section>
              <SectionTitle>
                <FileText size={18} />
                Additional Information
              </SectionTitle>
              <MetadataContainer>
                <pre>{JSON.stringify(transaction.metadata, null, 2)}</pre>
              </MetadataContainer>
            </Section>
          )}
        </Content>

        <Footer>
          <CloseButtonSecondary onClick={onClose}>
            Close
          </CloseButtonSecondary>
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
  max-width: 800px;
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
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const TransactionIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.type === 'credit' ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.type === 'credit' ? '#16a34a' : '#dc2626'};
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
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

const Section = styled.div`
  margin-bottom: 2rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem 0;
`;

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const OverviewCard = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
`;

const OverviewLabel = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
`;

const OverviewValue = styled.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => {
    if (props.type === 'credit') return '#16a34a';
    if (props.type === 'debit') return '#dc2626';
    return '#111827';
  }};
`;

const TypeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${props => props.type === 'credit' ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.type === 'credit' ? '#16a34a' : '#dc2626'};
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
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

const UserDetails = styled.div`
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
  margin: 0;
`;

const UserPhone = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
`;

const DetailsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const DetailLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  min-width: 120px;
`;

const DetailValue = styled.div`
  font-size: 0.875rem;
  color: #111827;
  text-align: right;
  flex: 1;
`;

const SourceBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background: #f3f4f6;
  color: #374151;
`;

const StatusContainer = styled.div`
  margin-bottom: 1rem;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid;
`;

const BankDetails = styled.div`
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const BankDetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;

  &:last-child {
    border-bottom: none;
  }
`;

const AdminAction = styled.div`
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 1rem;
`;

const AdminNotes = styled.p`
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  color: #374151;
  font-style: italic;
`;

const MetadataContainer = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  
  pre {
    font-size: 0.75rem;
    color: #374151;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
  }
`;

const Footer = styled.div`
  padding: 1.5rem 2rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  justify-content: flex-end;
`;

const CloseButtonSecondary = styled.button`
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #4b5563;
  }
`;

export default TransactionDetailsModal;