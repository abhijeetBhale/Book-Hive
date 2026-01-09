import React from 'react';
import styled from 'styled-components';
import { Wallet, TrendingUp, DollarSign, Clock } from 'lucide-react';

const WalletBalance = ({ walletData, loading = false }) => {
  if (loading) {
    return (
      <WalletContainer>
        <LoadingCard>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </LoadingCard>
      </WalletContainer>
    );
  }

  const {
    balance = 0,
    totalEarnings = 0,
    pendingEarnings = 0,
    withdrawnAmount = 0
  } = walletData || {};

  return (
    <WalletContainer>
      <MainBalanceCard>
        <BalanceHeader>
          <WalletIcon>
            <Wallet size={24} />
          </WalletIcon>
          <div>
            <BalanceLabel>Wallet Balance</BalanceLabel>
            <BalanceAmount>₹{balance.toFixed(2)}</BalanceAmount>
          </div>
        </BalanceHeader>
      </MainBalanceCard>

      <StatsGrid>
        <StatCard>
          <StatIcon color="#10B981">
            <TrendingUp size={20} />
          </StatIcon>
          <StatContent>
            <StatLabel>Total Earnings</StatLabel>
            <StatValue>₹{totalEarnings.toFixed(2)}</StatValue>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon color="#F59E0B">
            <Clock size={20} />
          </StatIcon>
          <StatContent>
            <StatLabel>Pending</StatLabel>
            <StatValue>₹{pendingEarnings.toFixed(2)}</StatValue>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon color="#6366F1">
            <DollarSign size={20} />
          </StatIcon>
          <StatContent>
            <StatLabel>Withdrawn</StatLabel>
            <StatValue>₹{withdrawnAmount.toFixed(2)}</StatValue>
          </StatContent>
        </StatCard>
      </StatsGrid>
    </WalletContainer>
  );
};

const WalletContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const MainBalanceCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 2rem;
  color: white;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
`;

const BalanceHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const WalletIcon = styled.div`
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BalanceLabel = styled.p`
  font-size: 0.875rem;
  opacity: 0.9;
  margin: 0 0 0.25rem 0;
`;

const BalanceAmount = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
`;

const LoadingCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #f1f5f9;
`;

const StatIcon = styled.div`
  background: ${props => props.color}20;
  color: ${props => props.color};
  border-radius: 10px;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatLabel = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 0.25rem 0;
`;

const StatValue = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

export default WalletBalance;