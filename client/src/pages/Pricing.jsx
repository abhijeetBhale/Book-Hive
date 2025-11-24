import React, { useState } from 'react';
import styled from 'styled-components';
import { Check, X } from 'lucide-react';
import VerificationPaymentModal from '../components/profile/VerificationPaymentModal';
import PremiumPaymentModal from '../components/profile/PremiumPaymentModal';
import SEO from '../components/SEO';
import { PAGE_SEO } from '../utils/seo';

const Pricing = () => {
    const [activeModal, setActiveModal] = useState(null); // 'verify', 'premium', or null

    const handleCloseModal = () => {
        setActiveModal(null);
    };

    const handleSuccess = () => {
        setActiveModal(null);
        // Optionally refresh user data or show success message
    };

    const plans = [
        {
            name: 'Free',
            price: '₹0',
            period: 'Forever',
            description: 'Perfect for casual readers getting started with BookHive community.',
            features: [
                { text: 'Browse up to 50 books', included: true },
                { text: 'Borrow 2 books per month', included: true },
                { text: 'Lend unlimited books', included: true },
                { text: 'Basic profile', included: true },
                { text: 'Join 1 event per month', included: true },
                { text: 'Send 10 messages per day', included: true },
                { text: 'Add up to 5 friends', included: true },
                { text: 'View nearby readers (5km radius)', included: true },
                { text: 'Verified badge', included: false },
                { text: 'Priority support', included: false },
                { text: 'Advanced analytics', included: false },
                { text: 'Unlimited event access', included: false }
            ],
            highlighted: false,
            buttonText: 'Current Plan',
            buttonAction: 'current'
        },
        {
            name: 'Verified Reader',
            price: '₹50',
            period: 'One-time',
            description: 'Stand out with a verified badge and unlock enhanced features for active readers.',
            features: [
                { text: 'Everything in Free', included: true },
                { text: 'Verified badge on profile', included: true },
                { text: 'Browse unlimited books', included: true },
                { text: 'Borrow 10 books per month', included: true },
                { text: 'Unlimited messaging', included: true },
                { text: 'Add up to 50 friends', included: true },
                { text: 'Join unlimited events', included: true },
                { text: 'View nearby readers (25km radius)', included: true },
                { text: 'Priority in search results', included: true },
                { text: 'Sell books on marketplace', included: true },
                { text: 'Custom profile themes', included: false },
                { text: 'Priority support', included: false }
            ],
            highlighted: true,
            buttonText: 'Get Verified',
            buttonAction: 'verify'
        },
        {
            name: 'Premium',
            price: '₹199',
            period: 'Per year',
            description: 'For power readers who want the ultimate BookHive experience with all features unlocked.',
            features: [
                { text: 'Everything in Verified Reader', included: true },
                { text: 'Unlimited book borrowing', included: true },
                { text: 'Unlimited friends', included: true },
                { text: 'View readers nationwide', included: true },
                { text: 'Featured profile badge', included: true },
                { text: 'Priority support (24/7)', included: true },
                { text: 'Advanced reading analytics', included: true },
                { text: 'Custom profile themes', included: true },
                { text: 'Early access to new features', included: true },
                { text: 'Create private book clubs', included: true },
                { text: 'Ad-free experience', included: true },
                { text: 'Exclusive community events', included: true }
            ],
            highlighted: false,
            buttonText: 'Upgrade to Premium',
            buttonAction: 'premium'
        }
    ];

    const handlePlanClick = (action) => {
        if (action === 'current') {
            return;
        }
        setActiveModal(action);
    };

    return (
        <>
            <SEO 
                title={PAGE_SEO.pricing?.title || "Pricing Plans | BookHive"}
                description={PAGE_SEO.pricing?.description || "Choose the perfect plan for your reading journey. From free to premium, unlock more features as you grow with the BookHive community."}
                keywords={PAGE_SEO.pricing?.keywords || "bookhive pricing, book sharing plans, premium membership, verified reader, book community subscription"}
                url={PAGE_SEO.pricing?.url || "https://book-hive-frontend.onrender.com/pricing"}
            />
            <PricingContainer>
                <Header>
                <Title>Choose Your Reading Journey</Title>
                <Subtitle>Unlock more features as you grow with the BookHive community</Subtitle>
            </Header>

            <PricingGrid>
                {plans.map((plan, index) => (
                    <PricingCard key={index} $highlighted={plan.highlighted}>
                        {plan.highlighted && <PopularBadge>Most Popular</PopularBadge>}

                        <CardHeader>
                            <PlanName $highlighted={plan.highlighted}>{plan.name}</PlanName>
                            <PriceWrapper>
                                <Price $highlighted={plan.highlighted}>{plan.price}</Price>
                                <Period $highlighted={plan.highlighted}>/{plan.period}</Period>
                            </PriceWrapper>
                            <Description $highlighted={plan.highlighted}>{plan.description}</Description>
                        </CardHeader>

                        <GetStartedButton
                            $highlighted={plan.highlighted}
                            onClick={() => handlePlanClick(plan.buttonAction)}
                            disabled={plan.buttonAction === 'current'}
                        >
                            {plan.buttonText}
                        </GetStartedButton>

                        <FeaturesSection>
                            <FeaturesTitle $highlighted={plan.highlighted}>What's included:</FeaturesTitle>
                            <FeaturesList>
                                {plan.features.map((feature, idx) => (
                                    <FeatureItem key={idx} included={feature.included}>
                                        <IconWrapper included={feature.included} $highlighted={plan.highlighted}>
                                            {feature.included ? <Check size={14} /> : <X size={14} />}
                                        </IconWrapper>
                                        <FeatureText included={feature.included} $highlighted={plan.highlighted}>
                                            {feature.text}
                                        </FeatureText>
                                    </FeatureItem>
                                ))}
                            </FeaturesList>
                        </FeaturesSection>
                    </PricingCard>
                ))}
            </PricingGrid>

            <VerificationPaymentModal
                isOpen={activeModal === 'verify'}
                onClose={handleCloseModal}
                onSuccess={handleSuccess}
            />

            <PremiumPaymentModal
                isOpen={activeModal === 'premium'}
                onClose={handleCloseModal}
                onSuccess={handleSuccess}
            />
            </PricingContainer>
        </>
    );
};

const PricingContainer = styled.div`
  min-height: 100vh;
  padding: 4rem 2rem;
  background: linear-gradient(to bottom, #f9fafb 0%, #ffffff 50%, #f9fafb 100%);
  
  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 4rem;
  
  @media (max-width: 768px) {
    margin-bottom: 2rem;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: #6b7280;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const PopularBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.375rem 1rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
`;

const PricingCard = styled.div`
  background: ${props => props.$highlighted ? '#1f2937' : '#ffffff'};
  border-radius: 16px;
  padding: 2rem;
  box-shadow: ${props => props.$highlighted
        ? '0 20px 60px rgba(102, 126, 234, 0.3)'
        : '0 4px 12px rgba(0, 0, 0, 0.08)'};
  border: ${props => props.$highlighted ? 'none' : '1px solid #e5e7eb'};
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
  
  ${props => props.$highlighted && `
    transform: scale(1.05);
    
    @media (max-width: 768px) {
      transform: scale(1);
    }
  `}
  
  &:hover {
    transform: ${props => props.$highlighted ? 'scale(1.08)' : 'translateY(-8px)'};
    box-shadow: ${props => props.$highlighted
        ? '0 24px 70px rgba(102, 126, 234, 0.4)'
        : '0 12px 24px rgba(0, 0, 0, 0.12)'};
      
    @media (max-width: 768px) {
      transform: ${props => props.$highlighted ? 'scale(1)' : 'translateY(-4px)'};
    }
  }
`;

const CardHeader = styled.div`
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: ${props => props.$highlighted ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb'};
`;

const PlanName = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.$highlighted ? '#ffffff' : '#1f2937'};
  margin-bottom: 0.5rem;
`;

const PriceWrapper = styled.div`
  display: flex;
  align-items: baseline;
  margin-bottom: 1rem;
`;

const Price = styled.div`
  font-size: 3rem;
  font-weight: 700;
  color: ${props => props.$highlighted ? '#ffffff' : '#1f2937'};
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Period = styled.span`
  font-size: 1rem;
  color: ${props => props.$highlighted ? 'rgba(255, 255, 255, 0.7)' : '#6b7280'};
  margin-left: 0.5rem;
`;

const Description = styled.p`
  font-size: 0.9375rem;
  color: ${props => props.$highlighted ? 'rgba(255, 255, 255, 0.8)' : '#6b7280'};
  line-height: 1.5;
`;

const GetStartedButton = styled.button`
  width: 100%;
  padding: 0.875rem 1.5rem;
  border-radius: 8px;
  border: ${props => props.$highlighted ? 'none' : '1px solid #e5e7eb'};
  background: ${props => props.$highlighted ? '#ffffff' : props.disabled ? '#f3f4f6' : '#667eea'};
  color: ${props => props.$highlighted ? '#1f2937' : props.disabled ? '#9ca3af' : '#ffffff'};
  font-size: 1rem;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  margin-bottom: 2rem;
  
  &:hover {
    background: ${props => {
        if (props.disabled) return '#f3f4f6';
        if (props.$highlighted) return '#f9fafb';
        return '#5568d3';
    }};
    transform: ${props => props.disabled ? 'none' : 'translateY(-2px)'};
  }
`;

const FeaturesSection = styled.div`
  border-top: ${props => props.$highlighted ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb'};
  padding-top: 1.5rem;
`;

const FeaturesTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.$highlighted ? '#ffffff' : '#1f2937'};
  margin-bottom: 1rem;
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  opacity: ${props => props.included ? 1 : 0.5};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const IconWrapper = styled.div`
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${props => {
        if (!props.included) return props.$highlighted ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6';
        return props.$highlighted ? 'rgba(255, 255, 255, 0.2)' : '#e0e7ff';
    }};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  
  svg {
    color: ${props => {
        if (!props.included) return props.$highlighted ? 'rgba(255, 255, 255, 0.4)' : '#9ca3af';
        return props.$highlighted ? '#ffffff' : '#667eea';
    }};
  }
`;

const FeatureText = styled.span`
  font-size: 0.9375rem;
  color: ${props => {
        if (!props.included) {
            return props.$highlighted ? 'rgba(255, 255, 255, 0.4)' : '#9ca3af';
        }
        return props.$highlighted ? 'rgba(255, 255, 255, 0.9)' : '#4b5563';
    }};
  line-height: 1.5;
  text-decoration: ${props => props.included ? 'none' : 'line-through'};
`;

export default Pricing;
