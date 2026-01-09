import React from 'react';
import styled from 'styled-components';
import { 
  Wallet, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Info, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

const EnhancedWalletBalance = ({ walletData, loading = false, onWithdrawClick }) => {
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

  const canWithdraw = pendingEarnings >= 100;

  return (
    <WalletContainer>
      {/* Main Balance Card with Clear Explanation */}
      <MainBalanceCard>
        <BalanceHeader>
          <WalletIcon>
            <Wallet size={28} />
          </WalletIcon>
          <BalanceInfo>
            <BalanceLabel>
              Your Wallet Balance
              <InfoTooltip>
                <HelpCircle size={14} />
                <TooltipText>
                  This is your total available balance from lending books to other readers
                </TooltipText>
              </InfoTooltip>
            </BalanceLabel>
            <BalanceAmount>₹{balance.toFixed(2)}</BalanceAmount>
            <BalanceSubtext>Available for withdrawal</BalanceSubtext>
          </BalanceInfo>
        </BalanceHeader>
      </MainBalanceCard>

      {/* Earnings Overview with Clear Labels */}
      <EarningsOverview>
        <SectionTitle>
          <TrendingUp size={20} />
          Your Earnings Breakdown
        </SectionTitle>
        <SectionSubtitle>
          Track how much you've earned from sharing your books with the community
        </SectionSubtitle>

        <StatsGrid>
          <StatCard highlight>
            <StatIcon color="#10B981">
              <Clock size={22} />
            </StatIcon>
            <StatContent>
              <StatLabel>
                Pending Earnings
                <InfoBadge>
                  <Info size={12} />
                </InfoBadge>
              </StatLabel>
              <StatValue>₹{pendingEarnings.toFixed(2)}</StatValue>
              <StatDescription>
                {canWithdraw 
                  ? "Ready to withdraw! Minimum ₹100 reached" 
                  : `Need ₹${(100 - pendingEarnings).toFixed(2)} more to withdraw`
                }
              </StatDescription>
              {canWithdraw && (
                <WithdrawButton onClick={onWithdrawClick}>
                  <DollarSign size={16} />
                  Withdraw Now
                  <ArrowRight size={14} />
                </WithdrawButton>
              )}
            </StatContent>
          </StatCard>

          <StatCard>
            <StatIcon color="#6366F1">
              <TrendingUp size={22} />
            </StatIcon>
            <StatContent>
              <StatLabel>Total Earned</StatLabel>
              <StatValue>₹{totalEarnings.toFixed(2)}</StatValue>
              <StatDescription>
                Your lifetime earnings from book lending
              </StatDescription>
            </StatContent>
          </StatCard>

          <StatCard>
            <StatIcon color="#8B5CF6">
              <CheckCircle size={22} />
            </StatIcon>
            <StatContent>
              <StatLabel>Already Withdrawn</StatLabel>
              <StatValue>₹{withdrawnAmount.toFixed(2)}</StatValue>
              <StatDescription>
                Amount successfully transferred to your bank
              </StatDescription>
            </StatContent>
          </StatCard>
        </StatsGrid>
      </EarningsOverview>

      {/* How It Works Section */}
      <HowItWorksSection>
        <SectionTitle>
          <Info size={20} />
          How Your Wallet Works
        </SectionTitle>
        
        <StepsContainer>
          <Step>
            <StepNumber>1</StepNumber>
            <StepContent>
              <StepTitle>Lend Your Books</StepTitle>
              <StepDescription>
                Set a lending fee when someone borrows your books
              </StepDescription>
            </StepContent>
          </Step>

          <Step>
            <StepNumber>2</StepNumber>
            <StepContent>
              <StepTitle>Earn Money</StepTitle>
              <StepDescription>
                Fees are added to your pending earnings after successful lending
              </StepDescription>
            </StepContent>
          </Step>

          <Step>
            <StepNumber>3</StepNumber>
            <StepContent>
              <StepTitle>Withdraw Anytime</StepTitle>
              <StepDescription>
                Request withdrawal once you have ₹100 or more (processed in 2-3 days)
              </StepDescription>
            </StepContent>
          </Step>
        </StepsContainer>
      </HowItWorksSection>

      {/* Withdrawal Status */}
      {!canWithdraw && (
        <WithdrawalStatusCard>
          <AlertCircle size={20} color="#F59E0B" />
          <StatusContent>
            <StatusTitle>Withdrawal Not Available Yet</StatusTitle>
            <StatusDescription>
              You need at least ₹100 in pending earnings to request a withdrawal. 
              Keep lending books to reach this minimum amount!
            </StatusDescription>
            <ProgressBar>
              <ProgressFill width={(pendingEarnings / 100) * 100} />
            </ProgressBar>
            <ProgressText>
              ₹{pendingEarnings.toFixed(2)} of ₹100.00 minimum
            </ProgressText>
          </StatusContent>
        </WithdrawalStatusCard>
      )}
    </WalletContainer>
  );
};

// Styled Components
const WalletContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const MainBalanceCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 2.5rem;
  color: white;
  box-shadow: 0 15px 35px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    transform: translate(30px, -30px);
  }
`;

const BalanceHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
`;

const WalletIcon = styled.div`
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
`;

const BalanceInfo = styled.div`
  flex: 1;
`;

const BalanceLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
`;

const InfoTooltip = styled.div`
  position: relative;
  cursor: help;
  
  &:hover .tooltip {
    opacity: 1;
    visibility: visible;
  }
`;

const TooltipText = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s;
  z-index: 10;
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.8);
  }
`;

const BalanceAmount = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  margin: 0;
  line-height: 1;
`;

const BalanceSubtext = styled.p`
  font-size: 0.875rem;
  opacity: 0.8;
  margin: 0.5rem 0 0 0;
`;

const LoadingCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
`;

const EarningsOverview = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid #f1f5f9;
`;

const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
`;

const SectionSubtitle = styled.p`
  color: #64748b;
  margin: 0 0 2rem 0;
  font-size: 1rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const StatCard = styled.div`
  background: ${props => props.highlight ? '#f0fdf4' : 'white'};
  border: 2px solid ${props => props.highlight ? '#10B981' : '#f1f5f9'};
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
`;

const StatIcon = styled.div`
  background: ${props => props.color}20;
  color: ${props => props.color};
  border-radius: 12px;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const InfoBadge = styled.div`
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatValue = styled.h3`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
`;

const StatDescription = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 1rem 0;
  line-height: 1.4;
`;

const WithdrawButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #10B981;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;

  &:hover {
    background: #059669;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
`;

const HowItWorksSection = styled.div`
  background: #f8fafc;
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid #e2e8f0;
`;

const StepsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1.5rem;
`;

const Step = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const StepNumber = styled.div`
  background: #4f46e5;
  color: white;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
`;

const StepDescription = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
`;

const WithdrawalStatusCard = styled.div`
  background: #fffbeb;
  border: 2px solid #fbbf24;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const StatusContent = styled.div`
  flex: 1;
`;

const StatusTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #92400e;
  margin: 0 0 0.5rem 0;
`;

const StatusDescription = styled.p`
  font-size: 0.875rem;
  color: #92400e;
  margin: 0 0 1rem 0;
  line-height: 1.4;
`;

const ProgressBar = styled.div`
  background: #fef3c7;
  border-radius: 10px;
  height: 8px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressFill = styled.div`
  background: #f59e0b;
  height: 100%;
  width: ${props => Math.min(props.width, 100)}%;
  border-radius: 10px;
  transition: width 0.3s ease;
`;

const ProgressText = styled.p`
  font-size: 0.75rem;
  color: #92400e;
  margin: 0;
  font-weight: 500;
`;

export default EnhancedWalletBalance;