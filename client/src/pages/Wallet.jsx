import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Download, RefreshCw, AlertCircle } from 'lucide-react';
import WalletBalance from '../components/wallet/WalletBalance';
import TransactionHistory from '../components/wallet/TransactionHistory';
import WithdrawalModal from '../components/wallet/WithdrawalModal';
import { walletAPI } from '../utils/walletAPI';
import toast from 'react-hot-toast';

const Wallet = () => {
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [walletResponse, transactionsResponse] = await Promise.all([
        walletAPI.getWalletDetails(),
        walletAPI.getTransactionHistory({ limit: 20 })
      ]);

      if (walletResponse.success) {
        setWalletData(walletResponse.data);
      }

      if (transactionsResponse.success) {
        setTransactions(transactionsResponse.data.transactions);
      }
    } catch (error) {
      console.error('Failed to load wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadWalletData();
      toast.success('Wallet data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleWithdrawalRequest = async (withdrawalData) => {
    try {
      const response = await walletAPI.requestWithdrawal(withdrawalData);
      
      if (response.success) {
        // Refresh wallet data to show updated balance
        await loadWalletData();
        return response;
      } else {
        throw new Error(response.message || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      throw error;
    }
  };

  const canWithdraw = walletData && walletData.pendingEarnings >= 100;

  return (
    <WalletContainer>
      <Header>
        <HeaderContent>
          <Title>My Wallet</Title>
          <Description>
            Manage your earnings from lending books and track your transaction history.
          </Description>
        </HeaderContent>
        
        <HeaderActions>
          <RefreshButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </RefreshButton>
          
          <WithdrawButton 
            onClick={() => setShowWithdrawalModal(true)}
            disabled={!canWithdraw}
          >
            <Download size={20} />
            Withdraw
          </WithdrawButton>
        </HeaderActions>
      </Header>

      {!canWithdraw && walletData && (
        <WithdrawalNotice>
          <AlertCircle size={20} />
          <NoticeText>
            Minimum withdrawal amount is ₹100. 
            {walletData.pendingEarnings < 100 && 
              ` You need ₹${(100 - walletData.pendingEarnings).toFixed(2)} more to withdraw.`
            }
          </NoticeText>
        </WithdrawalNotice>
      )}

      <Content>
        <WalletSection>
          <WalletBalance walletData={walletData} loading={loading} />
        </WalletSection>

        <TransactionSection>
          <TransactionHistory transactions={transactions} loading={loading} />
        </TransactionSection>
      </Content>

      <WithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        walletBalance={walletData?.pendingEarnings || 0}
        onWithdrawalRequest={handleWithdrawalRequest}
      />
    </WalletContainer>
  );
};

const WalletContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  min-height: 100vh;
  background: #f8fafc;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
`;

const Description = styled.p`
  color: #64748b;
  margin: 0;
  font-size: 1rem;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;

  @media (max-width: 768px) {
    justify-content: stretch;
  }
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    flex: 1;
    justify-content: center;
  }
`;

const WithdrawButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 768px) {
    flex: 2;
    justify-content: center;
  }
`;

const WithdrawalNotice = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  margin-bottom: 2rem;
`;

const NoticeText = styled.p`
  font-size: 0.875rem;
  color: #92400e;
  margin: 0;
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const WalletSection = styled.div`
  @media (min-width: 1024px) {
    grid-column: 1 / -1;
  }
`;

const TransactionSection = styled.div`
  @media (min-width: 1024px) {
    grid-column: 1 / -1;
  }
`;

export default Wallet;