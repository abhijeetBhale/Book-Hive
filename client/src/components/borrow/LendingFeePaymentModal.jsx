import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Wallet, Loader, AlertCircle, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const LendingFeePaymentModal = ({ isOpen, onClose, borrowRequest, onSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payment/create-lending-fee-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          borrowRequestId: borrowRequest._id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create order');
      }

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'BookHive',
        description: `Lending Fee for "${borrowRequest.book?.title}"`,
        order_id: data.order.id,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/payment/verify-lending-fee-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                borrowRequestId: borrowRequest._id
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok) {
              toast.success('✅ Lending fee paid successfully! The owner has been credited.', {
                duration: 5000
              });

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
        },
        theme: {
          color: '#10B981'
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

  if (!isOpen || !borrowRequest) return null;

  const lendingFee = borrowRequest.lendingFee || 0;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <X size={24} />
        </CloseButton>

        <Header>
          <IconWrapper>
            <Wallet size={40} color="#10B981" />
          </IconWrapper>
          <Title>Lending Fee Payment</Title>
        </Header>

        <Content>
          <InfoBox>
            <AlertCircle size={20} color="#10B981" />
            <InfoText>
              The book owner charges a lending fee for borrowing this book. 
              This fee supports the lending community and helps maintain the platform.
            </InfoText>
          </InfoBox>

          <BookInfo>
            <BookCover 
              src={borrowRequest.book?.coverImage || '/placeholder-book.png'} 
              alt={borrowRequest.book?.title}
              onError={(e) => {
                e.target.src = '/placeholder-book.png';
              }}
            />
            <BookDetails>
              <BookTitle>{borrowRequest.book?.title}</BookTitle>
              <BookAuthor>by {borrowRequest.book?.author}</BookAuthor>
            </BookDetails>
          </BookInfo>

          <FeeBreakdown>
            <FeeRow>
              <Label>Lending Fee:</Label>
              <Amount>₹{lendingFee.toFixed(2)}</Amount>
            </FeeRow>
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                This fee supports the book sharing community and helps maintain the platform.
              </p>
            </div>
          </FeeBreakdown>

          <Note>
            <TrendingUp size={16} />
            <span>By paying this fee, you're supporting the book owner and the BookHive community!</span>
          </Note>
        </Content>

        <Actions>
          <CancelButton onClick={onClose}>Cancel</CancelButton>
          <PayButton onClick={handlePayment} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader className="spin" size={20} />
                Processing...
              </>
            ) : (
              <>
                <Wallet size={20} />
                Pay ₹{lendingFee.toFixed(2)}
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
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #e5e7eb;
`;

const IconWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-radius: 50%;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const Content = styled.div`
  padding: 2rem;
`;

const InfoBox = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #ecfdf5;
  border-radius: 8px;
  border: 1px solid #a7f3d0;
  margin-bottom: 1.5rem;
`;

const InfoText = styled.p`
  font-size: 0.875rem;
  color: #065f46;
  margin: 0;
  line-height: 1.5;
`;

const BookInfo = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 1.5rem;
`;

const BookCover = styled.img`
  width: 60px;
  height: 90px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
`;

const BookDetails = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const BookTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
`;

const BookAuthor = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const FeeBreakdown = styled.div`
  padding: 1.5rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const FeeRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
`;

const Label = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
`;

const Amount = styled.span`
  font-size: 1.75rem;
  font-weight: 800;
  color: #10B981;
`;



const Note = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f0fdf4;
  border-radius: 8px;
  color: #166534;
  font-size: 0.875rem;

  svg {
    flex-shrink: 0;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1.5rem 2rem 2rem;
  border-top: 1px solid #e5e7eb;
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
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
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

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
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

export default LendingFeePaymentModal;

