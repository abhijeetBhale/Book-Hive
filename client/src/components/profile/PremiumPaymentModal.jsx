import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import { X, Crown, Star, Zap, Loader, TrendingUp, Users, Calendar, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import { getFullImageUrl } from '../../utils/imageHelpers';

const PremiumPaymentModal = ({ isOpen, onClose, onSuccess }) => {
  const { user, fetchProfile } = useContext(AuthContext);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (!scriptLoaded) {
      toast.error('Payment system is loading. Please try again.');
      return;
    }

    setIsProcessing(true);

    try {
      // Create order on backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/create-premium-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create order');
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: 'BookHive Premium',
        description: 'Premium Membership - Annual Subscription',
        order_id: data.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#667eea'
        },
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/verify-premium-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok) {
              toast.success('🎉 Welcome to Premium! Enjoy all the exclusive features!', {
                duration: 5000,
                icon: '👑'
              });

              // Refresh user profile
              await fetchProfile();

              if (onSuccess) {
                onSuccess();
              }

              onClose();
            } else {
              throw new Error(verifyData.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error(error.message || 'Payment verification failed. Please contact support.');
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            toast('Payment cancelled', { icon: 'ℹ️' });
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to initiate payment. Please try again.');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <X size={24} />
        </CloseButton>

        <Header>
          <IconWrapper>
            <Crown size={40} color="#667eea" />
          </IconWrapper>
          <Title>Upgrade to Premium</Title>
          <Price>₹199</Price>
          <Subtitle>per year • Best value for power readers</Subtitle>
        </Header>

        <PreviewSection>
          <PreviewTitle>Premium Benefits</PreviewTitle>

          <BenefitsList>
            <BenefitItem>
              <BenefitIcon><Star size={20} color="#667eea" /></BenefitIcon>
              <div>
                <strong>Unlimited Book Borrowing</strong>
                <p>Borrow as many books as you want, anytime</p>
              </div>
            </BenefitItem>

            <BenefitItem>
              <BenefitIcon><Users size={20} color="#667eea" /></BenefitIcon>
              <div>
                <strong>Unlimited Friends & Connections</strong>
                <p>Connect with unlimited readers nationwide</p>
              </div>
            </BenefitItem>

            <BenefitItem>
              <BenefitIcon><TrendingUp size={20} color="#667eea" /></BenefitIcon>
              <div>
                <strong>Advanced Analytics</strong>
                <p>Track your reading habits and get insights</p>
              </div>
            </BenefitItem>

            <BenefitItem>
              <BenefitIcon><Calendar size={20} color="#667eea" /></BenefitIcon>
              <div>
                <strong>Exclusive Events & Features</strong>
                <p>Access to premium book clubs and early features</p>
              </div>
            </BenefitItem>

            <BenefitItem>
              <BenefitIcon><Zap size={20} color="#667eea" /></BenefitIcon>
              <div>
                <strong>Priority Support</strong>
                <p>24/7 dedicated support for premium members</p>
              </div>
            </BenefitItem>

            <BenefitItem>
              <BenefitIcon><Crown size={20} color="#667eea" /></BenefitIcon>
              <div>
                <strong>Featured Profile Badge</strong>
                <p>Stand out with an exclusive premium badge</p>
              </div>
            </BenefitItem>
          </BenefitsList>
        </PreviewSection>

        <SecurityNote>
          <Shield size={16} />
          Secure payment powered by Razorpay
        </SecurityNote>

        <Actions>
          <CancelButton onClick={onClose}>Maybe Later</CancelButton>
          <PayButton onClick={handlePayment} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader className="spin" size={20} />
                Processing...
              </>
            ) : (
              <>
                <Crown size={20} />
                Upgrade to Premium
              </>
            )}
          </PayButton>
        </Actions>
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

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #f3f4f6;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  z-index: 10;

  &:hover {
    background: #e5e7eb;
  }
`;

const Header = styled.div`
  text-align: center;
  padding: 2rem 2rem 1.5rem;
`;

const IconWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  padding: 1rem;
  background: linear-gradient(135deg, #eff6ff 0%, #f3e8ff 100%);
  border-radius: 50%;
`;

const Title = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin: 1rem 0 0.5rem;
`;

const Price = styled.div`
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0.5rem 0;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
`;

const PreviewSection = styled.div`
  padding: 1.5rem 2rem;
  background: #fafafa;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
`;

const PreviewTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
`;

const BenefitsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const BenefitItem = styled.div`
  display: flex;
  align-items: start;
  gap: 1rem;

  div {
    flex: 1;

    strong {
      display: block;
      color: #111827;
      font-weight: 600;
      margin-bottom: 0.25rem;
      font-size: 0.9375rem;
    }

    p {
      color: #6b7280;
      font-size: 0.875rem;
      margin: 0;
    }
  }
`;

const BenefitIcon = styled.div`
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eff6ff 0%, #f3e8ff 100%);
  border-radius: 10px;
`;

const SecurityNote = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f9fafb;
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0 2rem;
  border-radius: 8px;
`;

const Actions = styled.div`
  display: flex;
  gap: 1rem;
  padding: 2rem;
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 0.875rem 1.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
`;

const PayButton = styled.button`
  flex: 2;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

export default PremiumPaymentModal;
