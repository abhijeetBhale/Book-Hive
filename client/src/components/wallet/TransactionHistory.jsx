import React from 'react';
import styled from 'styled-components';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle } from 'lucide-react';

const TransactionHistory = ({ transactions = [], loading = false }) => {
  if (loading) {
    return (
      <TransactionContainer>
        <Header>
          <Title>Transaction History</Title>
        </Header>
        <LoadingList>
          {[...Array(5)].map((_, index) => (
            <LoadingItem key={index}>
              <div className="animate-pulse flex items-center space-x-4">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </LoadingItem>
          ))}
        </LoadingList>
      </TransactionContainer>
    );
  }

  if (!transactions.length) {
    return (
      <TransactionContainer>
        <Header>
          <Title>Transaction History</Title>
        </Header>
        <EmptyState>
          <EmptyIcon>
            <Clock size={48} />
          </EmptyIcon>
          <EmptyTitle>No transactions yet</EmptyTitle>
          <EmptyDescription>
            Your transaction history will appear here once you start earning from lending books.
          </EmptyDescription>
        </EmptyState>
      </TransactionContainer>
    );
  }

  const getTransactionIcon = (type, source) => {
    if (type === 'credit') {
      return <ArrowUpRight size={20} />;
    } else {
      return <ArrowDownLeft size={20} />;
    }
  };

  const getTransactionColor = (type) => {
    return type === 'credit' ? '#10B981' : '#EF4444';
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <TransactionContainer>
      <Header>
        <Title>Transaction History</Title>
        <TransactionCount>{transactions.length} transactions</TransactionCount>
      </Header>
      
      <TransactionList>
        {transactions.map((transaction) => (
          <TransactionItem key={transaction._id}>
            <TransactionIcon color={getTransactionColor(transaction.type)}>
              {getTransactionIcon(transaction.type, transaction.source)}
            </TransactionIcon>
            
            <TransactionDetails>
              <TransactionTitle>{transaction.description}</TransactionTitle>
              <TransactionMeta>
                <SourceLabel>{getSourceLabel(transaction.source)}</SourceLabel>
                <TransactionDate>{formatDate(transaction.createdAt)}</TransactionDate>
              </TransactionMeta>
            </TransactionDetails>
            
            <TransactionAmount type={transaction.type}>
              {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
            </TransactionAmount>
          </TransactionItem>
        ))}
      </TransactionList>
    </TransactionContainer>
  );
};

const TransactionContainer = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #f1f5f9;
`;

const Header = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const TransactionCount = styled.span`
  font-size: 0.875rem;
  color: #64748b;
`;

const LoadingList = styled.div`
  padding: 1rem;
`;

const LoadingItem = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  
  &:last-child {
    border-bottom: none;
  }
`;

const EmptyState = styled.div`
  padding: 3rem 1.5rem;
  text-align: center;
`;

const EmptyIcon = styled.div`
  color: #94a3b8;
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
`;

const EmptyTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: #475569;
  margin: 0 0 0.5rem 0;
`;

const EmptyDescription = styled.p`
  color: #64748b;
  margin: 0;
  max-width: 300px;
  margin: 0 auto;
`;

const TransactionList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const TransactionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f8fafc;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const TransactionIcon = styled.div`
  background: ${props => props.color}20;
  color: ${props => props.color};
  border-radius: 10px;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const TransactionDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const TransactionTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 500;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TransactionMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
`;

const SourceLabel = styled.span`
  background: #f1f5f9;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
`;

const TransactionDate = styled.span``;

const TransactionAmount = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.type === 'credit' ? '#10B981' : '#EF4444'};
  flex-shrink: 0;
`;

export default TransactionHistory;