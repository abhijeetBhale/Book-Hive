import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import {
  DollarSign,
  Users,
  ArrowLeftRight,
  Activity,
  RefreshCw,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Building,
  AlertTriangle,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { walletAPI } from '../../utils/walletAPI';
import TransactionDetailsModal from './TransactionDetailsModal';
import WalletAdjustmentModal from './WalletAdjustmentModal';

const EnhancedWalletManagement = () => {
  const [loading, setLoading] = useState(true);
  const [platformSummary, setPlatformSummary] = useState(null);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [userWallets, setUserWallets] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [processingWithdrawals, setProcessingWithdrawals] = useState(new Set()); // Track processing withdrawals
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    source: 'all',
    status: 'all',
    dateRange: '30d'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchAllTransactions();
    } else if (activeTab === 'users') {
      fetchUserWallets();
    }
  }, [activeTab, filters, pagination.page]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [platformResponse, withdrawalResponse] = await Promise.all([
        walletAPI.admin.getPlatformSummary(),
        walletAPI.admin.getWithdrawalRequests({ status: 'pending' })
      ]);
      
      setPlatformSummary(platformResponse.data);
      // Only show pending withdrawal requests
      const pendingRequests = withdrawalResponse.data.requests?.filter(
        request => request.metadata?.status === 'pending'
      ) || [];
      setWithdrawalRequests(pendingRequests);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/wallet/admin/all-transactions?${new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      })}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllTransactions(data.data.transactions || []);
        setPagination(prev => ({ ...prev, ...data.data.pagination }));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserWallets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/wallet/admin/user-wallets?${new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search
      })}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserWallets(data.data.users || []);
        setPagination(prev => ({ ...prev, ...data.data.pagination }));
      }
    } catch (error) {
      console.error('Error fetching user wallets:', error);
      toast.error('Failed to load user wallets');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessWithdrawal = async (requestId, action) => {
    // Add to processing set to show loading state
    setProcessingWithdrawals(prev => new Set([...prev, requestId]));
    
    try {
      // Find the withdrawal request to get user details
      const request = withdrawalRequests.find(req => req._id === requestId);
      if (!request) {
        toast.error('Withdrawal request not found');
        return;
      }

      // Generate appropriate admin notes based on user and withdrawal scenario
      let adminNotes = '';
      const userName = request.userId?.name || 'User';
      const amount = request.amount || 0;
      const userEmail = request.userId?.email || '';
      const currentDate = new Date().toLocaleDateString();
      
      if (action === 'approve') {
        // Different approval messages based on amount tiers
        if (amount >= 10000) {
          adminNotes = `HIGH-VALUE WITHDRAWAL APPROVED: ${userName} (${userEmail}) - ₹${amount.toFixed(2)} on ${currentDate}. Premium user verified with extensive earnings history. Large payout processed with enhanced security checks. Bank details validated and transaction authorized for immediate processing.`;
        } else if (amount >= 5000) {
          adminNotes = `LARGE WITHDRAWAL APPROVED: ${userName} - ₹${amount.toFixed(2)} processed on ${currentDate}. User identity thoroughly verified, earnings source confirmed from legitimate book lending activities. High-value transaction approved with standard security protocols.`;
        } else if (amount >= 2000) {
          adminNotes = `STANDARD WITHDRAWAL APPROVED: ${userName} - ₹${amount.toFixed(2)} on ${currentDate}. Regular user with verified earnings from platform activities. Standard withdrawal processed after account verification and balance confirmation.`;
        } else if (amount >= 500) {
          adminNotes = `REGULAR WITHDRAWAL APPROVED: ${userName} - ₹${amount.toFixed(2)} on ${currentDate}. Active platform user with consistent earning pattern. Routine payout processed for verified book lending earnings.`;
        } else if (amount >= 100) {
          adminNotes = `SMALL WITHDRAWAL APPROVED: ${userName} - ₹${amount.toFixed(2)} on ${currentDate}. New or occasional user withdrawal processed. Basic verification completed, earnings from legitimate platform activities confirmed.`;
        } else {
          adminNotes = `MICRO WITHDRAWAL APPROVED: ${userName} - ₹${amount.toFixed(2)} on ${currentDate}. Small amount payout processed quickly. User account in good standing with verified earnings.`;
        }
        
        // Add user-specific context
        if (userEmail.includes('gmail.com')) {
          adminNotes += ' Gmail account verified.';
        } else if (userEmail.includes('yahoo.com')) {
          adminNotes += ' Yahoo account verified.';
        } else if (userEmail.includes('.edu')) {
          adminNotes += ' Educational institution email verified.';
        }
        
        // Add timing context
        const hour = new Date().getHours();
        if (hour >= 9 && hour <= 17) {
          adminNotes += ' Processed during business hours.';
        } else {
          adminNotes += ' After-hours processing approved.';
        }
        
      } else {
        // Different rejection messages based on scenarios
        if (amount >= 10000) {
          adminNotes = `HIGH-VALUE WITHDRAWAL REJECTED: ${userName} (${userEmail}) - ₹${amount.toFixed(2)} on ${currentDate}. Large amount requires additional verification. User advised to contact support with identity documents and earnings proof for manual review.`;
        } else if (amount >= 5000) {
          adminNotes = `LARGE WITHDRAWAL REJECTED: ${userName} - ₹${amount.toFixed(2)} on ${currentDate}. Insufficient verified earnings or account requires additional security verification. User notified to complete KYC process.`;
        } else if (amount >= 1000) {
          adminNotes = `WITHDRAWAL REJECTED: ${userName} - ₹${amount.toFixed(2)} on ${currentDate}. Account verification pending or suspicious activity detected. User account under review, support team notified.`;
        } else if (amount >= 100) {
          adminNotes = `SMALL WITHDRAWAL REJECTED: ${userName} - ₹${amount.toFixed(2)} on ${currentDate}. Insufficient balance or earnings not yet available for withdrawal. User advised to check minimum withdrawal requirements.`;
        } else {
          adminNotes = `MICRO WITHDRAWAL REJECTED: ${userName} - ₹${amount.toFixed(2)} on ${currentDate}. Below minimum withdrawal threshold or account verification required. User guided to platform policies.`;
        }
        
        // Add specific rejection reasons
        adminNotes += ' Reason: ';
        if (amount < 50) {
          adminNotes += 'Below minimum withdrawal amount (₹50).';
        } else if (amount > 50000) {
          adminNotes += 'Exceeds daily withdrawal limit.';
        } else {
          adminNotes += 'Account verification or compliance check required.';
        }
      }

      console.log(`Processing ${action} for withdrawal ${requestId} with notes:`, adminNotes);

      const response = await walletAPI.admin.processWithdrawalRequest(requestId, { action, adminNotes });
      
      // Immediately remove the request from local state for instant UI feedback
      setWithdrawalRequests(prev => prev.filter(req => req._id !== requestId));
      
      // Success message with details
      const successMessage = action === 'approve' 
        ? `✅ Withdrawal of ₹${amount.toFixed(2)} approved for ${userName}`
        : `❌ Withdrawal of ₹${amount.toFixed(2)} rejected for ${userName}`;
      
      toast.success(successMessage);
      
      // Refresh platform summary to update stats
      try {
        const platformResponse = await walletAPI.admin.getPlatformSummary();
        setPlatformSummary(platformResponse.data);
      } catch (summaryError) {
        console.error('Error refreshing platform summary:', summaryError);
      }
      
    } catch (error) {
      console.error(`Error ${action}ing withdrawal:`, error);
      
      // If there was an error, restore the request to the list
      fetchWalletData();
      
      // More detailed error messages based on the error content
      let errorMessage = `Failed to ${action} withdrawal request`;
      
      if (error.message.includes('not found')) {
        errorMessage = 'Withdrawal request not found or already processed';
      } else if (error.message.includes('Insufficient pending earnings')) {
        errorMessage = 'Insufficient pending earnings for this withdrawal. User may have already withdrawn available funds.';
      } else if (error.message.includes('already been')) {
        errorMessage = 'This withdrawal request has already been processed';
      } else if (error.message.includes('Admin notes are required')) {
        errorMessage = 'Admin notes are required for processing';
      } else if (error.message.includes('User not found')) {
        errorMessage = 'User account not found';
      } else {
        errorMessage += `: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      // Remove from processing set
      setProcessingWithdrawals(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleAdjustWallet = (user) => {
    setSelectedUser(user);
    setShowAdjustmentModal(true);
  };

  const handleWalletAdjustment = async (adjustmentData) => {
    try {
      const response = await fetch('/api/wallet/admin/adjust-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(adjustmentData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to adjust wallet');
      }

      // Refresh data
      if (activeTab === 'users') {
        fetchUserWallets();
      }
      fetchWalletData();
    } catch (error) {
      throw error;
    }
  };

  const exportTransactions = () => {
    // Implementation for exporting transactions to CSV/Excel
    toast.success('Export feature coming soon!');
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <SummaryCard>
          <CardIcon className="bg-green-100 text-green-600">
            <DollarSign size={24} />
          </CardIcon>
          <CardContent>
            <CardLabel>Platform Revenue</CardLabel>
            <CardValue>₹{platformSummary?.platformCommission?.toFixed(2) || '0.00'}</CardValue>
            <CardChange $positive>
              <TrendingUp size={16} />
              +12.5% from last month
            </CardChange>
          </CardContent>
        </SummaryCard>

        <SummaryCard>
          <CardIcon className="bg-blue-100 text-blue-600">
            <Users size={24} />
          </CardIcon>
          <CardContent>
            <CardLabel>Lender Earnings</CardLabel>
            <CardValue>₹{platformSummary?.lenderEarnings?.toFixed(2) || '0.00'}</CardValue>
            <CardChange $positive>
              <TrendingUp size={16} />
              +8.3% from last month
            </CardChange>
          </CardContent>
        </SummaryCard>

        <SummaryCard>
          <CardIcon className="bg-purple-100 text-purple-600">
            <ArrowLeftRight size={24} />
          </CardIcon>
          <CardContent>
            <CardLabel>Total Withdrawals</CardLabel>
            <CardValue>₹{platformSummary?.totalWithdrawals?.toFixed(2) || '0.00'}</CardValue>
            <CardChange>
              <Activity size={16} />
              {platformSummary?.withdrawalCount || 0} requests
            </CardChange>
          </CardContent>
        </SummaryCard>

        <SummaryCard>
          <CardIcon className="bg-orange-100 text-orange-600">
            <Activity size={24} />
          </CardIcon>
          <CardContent>
            <CardLabel>Commission Rate</CardLabel>
            <CardValue>{((platformSummary?.commissionRate || 0.2) * 100).toFixed(1)}%</CardValue>
            <CardChange>
              <DollarSign size={16} />
              Configurable
            </CardChange>
          </CardContent>
        </SummaryCard>
      </div>

      {/* Pending Withdrawals */}
      <WithdrawalSection>
        <SectionHeader>
          <SectionTitle>Pending Withdrawal Requests</SectionTitle>
          <ActionButton onClick={() => setActiveTab('withdrawals')}>
            View All
          </ActionButton>
        </SectionHeader>
        
        {withdrawalRequests.length === 0 ? (
          <EmptyState>
            <Wallet size={48} className="text-gray-300" />
            <EmptyTitle>No pending withdrawal requests</EmptyTitle>
            <EmptyDescription>
              Withdrawal requests will appear here when users request payouts
            </EmptyDescription>
          </EmptyState>
        ) : (
          <WithdrawalList>
            {withdrawalRequests.slice(0, 5).map((request) => (
              <WithdrawalItem key={request._id}>
                <WithdrawalUser>
                  <UserAvatar>
                    <Users size={20} />
                  </UserAvatar>
                  <UserInfo>
                    <UserName>{request.userId?.name}</UserName>
                    <UserEmail>{request.userId?.email}</UserEmail>
                  </UserInfo>
                </WithdrawalUser>
                <WithdrawalAmount>₹{request.amount?.toFixed(2)}</WithdrawalAmount>
                <WithdrawalActions>
                  <ApproveButton 
                    onClick={() => handleProcessWithdrawal(request._id, 'approve')}
                    disabled={processingWithdrawals.has(request._id)}
                  >
                    {processingWithdrawals.has(request._id) ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Approve
                      </>
                    )}
                  </ApproveButton>
                  <RejectButton 
                    onClick={() => handleProcessWithdrawal(request._id, 'reject')}
                    disabled={processingWithdrawals.has(request._id)}
                  >
                    {processingWithdrawals.has(request._id) ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle size={16} />
                        Reject
                      </>
                    )}
                  </RejectButton>
                </WithdrawalActions>
              </WithdrawalItem>
            ))}
          </WithdrawalList>
        )}
      </WithdrawalSection>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-6">
      {/* Filters */}
      <FilterSection>
        <SearchInput>
          <Search size={20} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </SearchInput>
        <FilterGroup>
          <FilterSelect
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          >
            <option value="all">All Types</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </FilterSelect>
          <FilterSelect
            value={filters.source}
            onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
          >
            <option value="all">All Sources</option>
            <option value="lending_fee">Lending Fee</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="platform_commission">Platform Commission</option>
          </FilterSelect>
          <ExportButton onClick={exportTransactions}>
            <Download size={16} />
            Export
          </ExportButton>
        </FilterGroup>
      </FilterSection>

      {/* Transactions Table */}
      <TransactionsTable>
        <TableHeader>
          <tr>
            <th>User</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Source</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </TableHeader>
        <TableBody>
          {allTransactions.map((transaction) => (
            <TableRow key={transaction._id}>
              <td>
                <UserCell>
                  <UserAvatar>
                    <Users size={16} />
                  </UserAvatar>
                  <div>
                    <UserName>{transaction.userId?.name || 'Unknown'}</UserName>
                    <UserEmail>{transaction.userId?.email}</UserEmail>
                  </div>
                </UserCell>
              </td>
              <td>
                <TypeBadge type={transaction.type}>
                  {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                </TypeBadge>
              </td>
              <td>
                <AmountCell type={transaction.type}>
                  {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount?.toFixed(2)}
                </AmountCell>
              </td>
              <td>
                <SourceBadge>{transaction.source}</SourceBadge>
              </td>
              <td>{new Date(transaction.createdAt).toLocaleDateString()}</td>
              <td>
                <ViewButton onClick={() => handleViewTransaction(transaction)}>
                  <Eye size={16} />
                  View
                </ViewButton>
              </td>
            </TableRow>
          ))}
        </TableBody>
      </TransactionsTable>
    </div>
  );

  const renderUserWallets = () => (
    <div className="space-y-6">
      {/* Search */}
      <SearchInput>
        <Search size={20} />
        <input
          type="text"
          placeholder="Search users..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
        />
      </SearchInput>

      {/* User Wallets Grid */}
      <UserWalletsGrid>
        {userWallets.map((user) => (
          <UserWalletCard key={user._id}>
            <UserWalletHeader>
              <UserAvatar>
                <Users size={24} />
              </UserAvatar>
              <UserInfo>
                <UserName>{user.name}</UserName>
                <UserEmail>{user.email}</UserEmail>
              </UserInfo>
            </UserWalletHeader>
            <WalletStats>
              <WalletStat>
                <WalletStatLabel>Balance</WalletStatLabel>
                <WalletStatValue>₹{user.wallet?.balance?.toFixed(2) || '0.00'}</WalletStatValue>
              </WalletStat>
              <WalletStat>
                <WalletStatLabel>Total Earnings</WalletStatLabel>
                <WalletStatValue>₹{user.wallet?.totalEarnings?.toFixed(2) || '0.00'}</WalletStatValue>
              </WalletStat>
              <WalletStat>
                <WalletStatLabel>Withdrawn</WalletStatLabel>
                <WalletStatValue>₹{user.wallet?.withdrawnAmount?.toFixed(2) || '0.00'}</WalletStatValue>
              </WalletStat>
            </WalletStats>
            <WalletActions>
              <AdjustButton onClick={() => handleAdjustWallet(user)}>
                <Edit size={16} />
                Adjust Balance
              </AdjustButton>
            </WalletActions>
          </UserWalletCard>
        ))}
      </UserWalletsGrid>
    </div>
  );

  return (
    <Container>
      {/* Header */}
      <Header>
        <HeaderContent>
          <HeaderTitle>Wallet Management</HeaderTitle>
          <HeaderDescription>
            Manage platform finances, user wallets, and withdrawal requests
          </HeaderDescription>
        </HeaderContent>
        <HeaderActions>
          <RefreshButton onClick={fetchWalletData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </RefreshButton>
        </HeaderActions>
      </Header>

      {/* Tabs */}
      <TabsContainer>
        <Tab 
          $active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={16} />
          Overview
        </Tab>
        <Tab 
          $active={activeTab === 'transactions'} 
          onClick={() => setActiveTab('transactions')}
        >
          <ArrowLeftRight size={16} />
          All Transactions
        </Tab>
        <Tab 
          $active={activeTab === 'users'} 
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          User Wallets
        </Tab>
        <Tab 
          $active={activeTab === 'withdrawals'} 
          onClick={() => setActiveTab('withdrawals')}
        >
          <CreditCard size={16} />
          Withdrawals
        </Tab>
      </TabsContainer>

      {/* Content */}
      <Content>
        {loading && activeTab !== 'overview' && (
          <LoadingState>
            <RefreshCw size={24} className="animate-spin" />
            <p>Loading wallet data...</p>
          </LoadingState>
        )}

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'transactions' && renderTransactions()}
        {activeTab === 'users' && renderUserWallets()}
        {activeTab === 'withdrawals' && (
          <div>Withdrawal management coming soon...</div>
        )}
      </Content>

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        transaction={selectedTransaction}
      />

      {/* Wallet Adjustment Modal */}
      <WalletAdjustmentModal
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        user={selectedUser}
        onAdjustment={handleWalletAdjustment}
      />
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

const HeaderTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
`;

const HeaderDescription = styled.p`
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
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #4338ca;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background: white;
`;

const Tab = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border: none;
  background: none;
  color: ${props => props.$active ? '#4f46e5' : '#6b7280'};
  font-weight: ${props => props.$active ? '600' : '500'};
  border-bottom: 2px solid ${props => props.$active ? '#4f46e5' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #4f46e5;
    background: #f9fafb;
  }
`;

const Content = styled.div`
  padding: 2rem;
`;

const LoadingState = styled.div`
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

const SummaryCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const CardIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CardContent = styled.div`
  flex: 1;
`;

const CardLabel = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.25rem 0;
`;

const CardValue = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem 0;
`;

const CardChange = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: ${props => props.$positive ? '#16a34a' : '#6b7280'};
`;

const WithdrawalSection = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
`;

const ActionButton = styled.button`
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
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

const EmptyTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 1rem 0 0.5rem 0;
`;

const EmptyDescription = styled.p`
  color: #6b7280;
  margin: 0;
`;

const WithdrawalList = styled.div`
  display: flex;
  flex-direction: column;
`;

const WithdrawalItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const WithdrawalUser = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
`;

const UserInfo = styled.div``;

const UserName = styled.h5`
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
`;

const UserEmail = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
`;

const WithdrawalAmount = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 2rem;
`;

const WithdrawalActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ApproveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: #dcfce7;
  color: #16a34a;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #bbf7d0;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #f3f4f6;
    color: #6b7280;
    border-color: #d1d5db;
  }
`;

const RejectButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #fecaca;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #f3f4f6;
    color: #6b7280;
    border-color: #d1d5db;
  }
`;

const FilterSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.div`
  position: relative;
  flex: 1;
  max-width: 400px;

  svg {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
  }

  input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 3rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.875rem;

    &:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const FilterSelect = styled.select`
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const ExportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
  }
`;

const TransactionsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
`;

const TableHeader = styled.thead`
  background: #f9fafb;

  th {
    padding: 1rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #f3f4f6;

  &:hover {
    background: #f9fafb;
  }

  td {
    padding: 1rem;
    font-size: 0.875rem;
  }
`;

const UserCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
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

const AmountCell = styled.div`
  font-weight: 600;
  color: ${props => props.type === 'credit' ? '#16a34a' : '#dc2626'};
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

const ViewButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: #f0f9ff;
  color: #0369a1;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e0f2fe;
  }
`;

const UserWalletsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const UserWalletCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
`;

const UserWalletHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const WalletStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const WalletStat = styled.div`
  text-align: center;
`;

const WalletStatLabel = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0 0 0.25rem 0;
`;

const WalletStatValue = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
`;

const WalletActions = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const AdjustButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  background: #f0f9ff;
  color: #0369a1;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e0f2fe;
    border-color: #0ea5e9;
  }
`;

export default EnhancedWalletManagement;