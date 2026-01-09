import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle, 
  XCircle,
  Filter,
  Calendar,
  BookOpen,
  CreditCard,
  TrendingUp,
  Eye,
  Search
} from 'lucide-react';

const EnhancedTransactionHistory = ({ transactions = [], loading = false }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return (
      <TransactionContainer>
        <Header>
          <HeaderContent>
            <Title>Your Transaction History</Title>
            <Subtitle>Track all your earnings and withdrawals</Subtitle>
          </HeaderContent>
        </Header>
        <LoadingList>
          {[...Array(5)].map((_, index) => (
            <LoadingItem key={index}>
              <div className="animate-pulse flex items-center space-x-4">
                <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </LoadingItem>
          ))}
        </LoadingList>
      </TransactionContainer>
    );
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = filter === 'all' || transaction.type === filter;
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getSourceLabel(transaction.source).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (!transactions.length) {
    return (
      <TransactionContainer>
        <Header>
          <HeaderContent>
            <Title>Your Transaction History</Title>
            <Subtitle>Track all your earnings and withdrawals</Subtitle>
          </HeaderContent>
        </Header>
        <EmptyState>
          <EmptyIcon>
            <BookOpen size={64} />
          </EmptyIcon>
          <EmptyTitle>No transactions yet</EmptyTitle>
          <EmptyDescription>
            Start lending your books to earn money! Your transaction history will appear here 
            once you receive your first lending fee payment.
          </EmptyDescription>
          <EmptyActions>
            <ActionButton onClick={() => window.location.href = '/my-books'}>
              <BookOpen size={16} />
              Add Books to Lend
            </ActionButton>
          </EmptyActions>
        </EmptyState>
      </TransactionContainer>
    );
  }
  const getTransactionIcon = (type, source) => {
    if (source === 'lending_fee') return <Boo