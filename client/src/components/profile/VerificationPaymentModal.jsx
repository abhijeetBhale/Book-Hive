import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import { X, CheckCircle, Shield, Star, Zap, Loader, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import { getFullImageUrl } from '../../utils/imageHelpers';

const VerificationPaymentModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [verificationPrice, setVerificationPrice] = useState(50);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Create order
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payment/create-verification-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a configuration error
        if (response.status === 503) {
          toast.error('Payment service is not configured yet. Please contact support or check setup instructions.');
          setLoading(false);
          return;
        }
        throw new Error(data.message || 'Failed to create order');
      }

      // Check if Razorpay script is loaded
      if (!window.Razorpay) {
        toast.error('Payment gateway not loaded. Please refresh the page and try again.');
        setLoading(false);
        return;
      }

      // Initialize Razorpay
      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'BookHive',
        description: 'Verified Account Badge',
        order_id: data.order.id,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await fetch(`${import.meta.env.VITE_API_URL}/payment/verify-payment`, {
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

            if (verifyData.success) {
              toast.success('🎉 Verification badge activated!');
              onSuccess();
              onClose();
            } else {
              toast.error('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Failed to verify payment. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: '',
          email: '',
        },
        theme: {
          color: '#4F46E5'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <X size={24} />
        </CloseButton>

        <Header>
          <BadgeIcon>
            <CheckCircle size={48} color="#3b82f6" />
          </BadgeIcon>
          <h2>Get Verified on BookHive</h2>
          <Price>₹{verificationPrice}</Price>
          <Subtitle>One-time payment • Lifetime verification</Subtitle>
        </Header>

        <PreviewSection>
          <PreviewTitle>✨ How it will look on your profile:</PreviewTitle>
          <ProfilePreview>
            <ProfileImage 
              src={getFullImageUrl(user?.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=4F46E5&color=fff&size=128`}
              alt={user?.name}
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=4F46E5&color=fff&size=128`;
              }}
            />
            <ProfileInfo>
              <NameWithBadge>
                <ProfileName>{user?.name || 'Your Name'}</ProfileName>
                <VerifiedBadgePreview>
                  <CheckCircle size={28} fill="#3b82f6" color="white" />
                </VerifiedBadgePreview>
              </NameWithBadge>
              <ProfileStats>
                <StatItem>
                  <BookOpen size={16} />
                  <span>{user?.booksOwned?.length || 1} Book in Bookshelf</span>
                </StatItem>
              </ProfileStats>
              <ReviewInfo>
                <Star size={18} fill="#fbbf24" color="#fbbf24" />
                <ReviewText>
                  <strong>5.0</strong>
                  <ReviewCount>{user?.rating?.reviewCount || 1} Review</ReviewCount>
                </ReviewText>
              </ReviewInfo>
            </ProfileInfo>
          </ProfilePreview>
        </PreviewSection>

        <Benefits>
          <h3>What you'll get:</h3>
          <BenefitItem>
            <CheckCircle size={20} color="#10b981" />
            <div>
              <strong>Verified Badge</strong>
              <p>Blue checkmark displayed next to your name everywhere</p>
            </div>
          </BenefitItem>
          <BenefitItem>
            <Shield size={20} color="#10b981" />
            <div>
              <strong>Increased Trust</strong>
              <p>Build credibility with other readers in the community</p>
            </div>
          </BenefitItem>
          <BenefitItem>
            <Star size={20} color="#10b981" />
            <div>
              <strong>Better Visibility</strong>
              <p>Stand out in search results and user listings</p>
            </div>
          </BenefitItem>
          <BenefitItem>
            <Zap size={20} color="#10b981" />
            <div>
              <strong>Priority Support</strong>
              <p>Get faster responses from our support team</p>
            </div>
          </BenefitItem>
        </Benefits>

        <SecurityNote>
          <Shield size={16} />
          <span>Secure payment powered by Razorpay</span>
        </SecurityNote>

        <Actions>
          <CancelButton onClick={onClose} disabled={loading}>
            Cancel
          </CancelButton>
          <PayButton onClick={handlePayment} disabled={loading}>
            {loading ? (
              <>
                <Loader className="spin" size={16} />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Get Verified Now
              </>
            )}
          </PayButton>
        </Actions>
      </ModalContainer>
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

const ModalContainer = styled.div`
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #111827;
  }
`;

const Header = styled.div`
  text-align: center;
  padding: 2rem 2rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 1rem 0 0.5rem;
  }
`;

const BadgeIcon = styled.div`
  display: inline-flex;
  padding: 1rem;
  background: #eff6ff;
  border-radius: 50%;
`;

const Price = styled.div`
  font-size: 2.5rem;
  font-weight: 800;
  color: #4F46E5;
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
  margin-bottom: 1rem;
`;

const ProfilePreview = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
`;

const ProfileImage = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #f3f4f6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const NameWithBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const ProfileName = styled.h4`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const VerifiedBadgePreview = styled.span`
  display: inline-flex;
  align-items: center;
  color: #3b82f6;
  font-size: 24px;
  animation: pulse 2s infinite;
  
  svg {
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.9;
    }
  }
`;

const ProfileStats = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  margin-bottom: 1rem;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  
  svg {
    color: #6b7280;
  }
  
  span {
    color: #6b7280;
  }
`;

const ReviewInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const ReviewText = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  strong {
    font-size: 1.125rem;
    font-weight: 700;
    color: #111827;
  }
`;

const ReviewCount = styled.span`
  font-size: 0.875rem;
  color: #4f46e5;
  font-weight: 600;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const Benefits = styled.div`
  padding: 2rem;

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 1rem;
  }
`;

const BenefitItem = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.25rem;
  align-items: start;

  div {
    flex: 1;

    strong {
      display: block;
      color: #111827;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    p {
      color: #6b7280;
      font-size: 0.875rem;
      margin: 0;
    }
  }
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
  border-top: 1px solid #e5e7eb;
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f9fafb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PayButton = styled.button`
  flex: 2;
  padding: 0.75rem 1.5rem;
  border: none;
  background: linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
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

export default VerificationPaymentModal;
