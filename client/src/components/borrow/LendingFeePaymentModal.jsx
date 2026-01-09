import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Wallet, AlertCircle, TrendingUp, CreditCard, Smartphone, Building, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DotWaveLoader from '../ui/DotWaveLoader';

const LendingFeePaymentModal = ({ isOpen, onClose, borrowRequest, onSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  // Check if payment is already completed
  const isPaymentCompleted = borrowRequest?.lendingFeeStatus === 'paid';

  useEffect(() => {
    // Don't load Razorpay script if payment is already completed
    if (isPaymentCompleted) {
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ Razorpay script loaded successfully');
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.error('❌ Failed to load Razorpay script');
      toast.error('Failed to load payment system. Please refresh and try again.');
    };
    document.body.appendChild(script);

    // Suppress Razorpay SVG console errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args[0];
      if (typeof message === 'string' && 
          (message.includes('SVG') && message.includes('height') && message.includes('auto')) ||
          message.includes('x-rtb-fingerprint-id')) {
        // Suppress these specific Razorpay-related errors
        return;
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      // Restore original console.error
      console.error = originalConsoleError;
    };
  }, []);

  const handlePayment = async () => {
    if (!scriptLoaded) {
      toast.error('Payment system is loading. Please try again in a moment.');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      console.log('🔄 Starting payment process...', {
        borrowRequestId: borrowRequest._id,
        lendingFee: borrowRequest.lendingFee,
        bookTitle: borrowRequest.book?.title
      });

      // Create order on backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payment/create-lending-fee-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          borrowRequestId: borrowRequest._id
        })
      });

      console.log('📡 Backend response status:', response.status);
      const data = await response.json();
      console.log('📡 Backend response data:', data);

      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to create payment order');
      }

      console.log('🎫 Creating Razorpay options...', {
        orderId: data.order.id,
        amount: data.order.amount,
        currency: data.order.currency,
        key: data.key
      });

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'BookHive',
        description: `Lending Fee for "${borrowRequest.book?.title}"`,
        order_id: data.order.id,
        handler: async function (response) {
          console.log('✅ Payment successful, verifying...', {
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id
          });

          try {
            // Verify payment on backend
            const verifyResponse = await fetch(`${import.meta.env.VITE_API_URL}/payment/verify-lending-fee-payment`, {
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
            console.log('🔍 Verification response:', verifyData);

            if (verifyResponse.ok && verifyData.success) {
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
            console.error('❌ Payment verification error:', error);
            toast.error(error.message || 'Payment verification failed. Please contact support.');
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: borrowRequest.borrower?.name || '',
          email: borrowRequest.borrower?.email || '',
          contact: borrowRequest.borrower?.phone || ''
        },
        notes: {
          borrowRequestId: borrowRequest._id,
          bookTitle: borrowRequest.book?.title
        },
        theme: {
          color: '#10B981'
        },
        modal: {
          ondismiss: function () {
            console.log('❌ Payment modal dismissed');
            setIsProcessing(false);
            toast('Payment cancelled', { icon: 'ℹ️' });
          },
          confirm_close: true,
          escape: true,
          animation: true,
          backdropclose: false
        },
        retry: {
          enabled: true,
          max_count: 3
        },
        timeout: 300, // 5 minutes timeout
        remember_customer: false
      };

      console.log('🚀 Opening Razorpay modal...');
      
      if (!window.Razorpay) {
        throw new Error('Razorpay is not loaded. Please refresh the page and try again.');
      }

      const razorpay = new window.Razorpay(options);
      
      // Add error handler for Razorpay
      razorpay.on('payment.failed', function (response) {
        console.error('❌ Payment failed:', response.error);
        setPaymentError(response.error);
        setIsProcessing(false);
        
        let errorMessage = 'Payment failed. ';
        
        // Handle specific error codes
        if (response.error.code === 'BAD_REQUEST_ERROR') {
          if (response.error.description?.includes('international')) {
            errorMessage += 'International cards are not supported. Please use an Indian debit/credit card, UPI, or net banking.';
          } else {
            errorMessage += 'Please check your card details and try again.';
          }
        } else if (response.error.code === 'GATEWAY_ERROR') {
          errorMessage += 'Payment gateway error. Please try again.';
        } else if (response.error.code === 'NETWORK_ERROR') {
          errorMessage += 'Network error. Please check your connection.';
        } else if (response.error.code === 'SERVER_ERROR') {
          errorMessage += 'Server error. Please try again later.';
        } else {
          errorMessage += response.error.description || 'Please try again.';
        }
        
        toast.error(errorMessage, { duration: 8000 });
      });

      razorpay.open();

    } catch (error) {
      console.error('❌ Payment error:', error);
      setPaymentError(error);
      toast.error(error.message || 'Failed to initiate payment. Please try again.');
      setIsProcessing(false);
    }
  };

  if (!isOpen || !borrowRequest) return null;

  const lendingFee = borrowRequest.lendingFee || 0;

  // If payment is completed, show completion message
  if (isPaymentCompleted) {
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
            <Title>Payment Completed</Title>
          </Header>

          <Content>
            <CompletedMessage>
              <CheckCircle size={48} color="#10B981" />
              <CompletedTitle>Lending Fee Paid Successfully!</CompletedTitle>
              <CompletedDescription>
                You have successfully paid the lending fee of ₹{lendingFee.toFixed(2)} for "{borrowRequest.book?.title}". 
                The book owner has been credited with their earnings.
              </CompletedDescription>
              
              {borrowRequest.lendingFeePaymentId && (
                <PaymentDetails>
                  <DetailRow>
                    <DetailLabel>Payment ID:</DetailLabel>
                    <DetailValue>{borrowRequest.lendingFeePaymentId}</DetailValue>
                  </DetailRow>
                  {borrowRequest.paymentCompletedAt && (
                    <DetailRow>
                      <DetailLabel>Completed At:</DetailLabel>
                      <DetailValue>
                        {new Date(borrowRequest.paymentCompletedAt).toLocaleString()}
                      </DetailValue>
                    </DetailRow>
                  )}
                </PaymentDetails>
              )}
            </CompletedMessage>
          </Content>

          <Actions>
            <PayButton onClick={onClose}>
              <Wallet size={20} />
              Close
            </PayButton>
          </Actions>
        </Modal>
      </Overlay>
    );
  }

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

          {/* Payment Methods Info */}
          <PaymentMethods>
            <PaymentMethodsTitle>Accepted Payment Methods (Indian Cards Only)</PaymentMethodsTitle>
            <PaymentMethodsList>
              <PaymentMethod>
                <CreditCard size={16} />
                <span>Indian Debit/Credit Cards</span>
              </PaymentMethod>
              <PaymentMethod>
                <Building size={16} />
                <span>Net Banking</span>
              </PaymentMethod>
              <PaymentMethod>
                <Smartphone size={16} />
                <span>UPI & Wallets</span>
              </PaymentMethod>
            </PaymentMethodsList>
            <PaymentNote>
              Note: International cards are not supported. Please use Indian payment methods only.
            </PaymentNote>
          </PaymentMethods>

          {paymentError && (
            <ErrorBox>
              <AlertCircle size={16} color="#dc2626" />
              <ErrorText>
                Payment Error: {paymentError.description || paymentError.message || 'Unknown error occurred'}
              </ErrorText>
            </ErrorBox>
          )}

          <Note>
            <TrendingUp size={16} />
            <span>By paying this fee, you're supporting the book owner and the BookHive community!</span>
          </Note>
        </Content>

        <Actions>
          <CancelButton onClick={onClose} disabled={isProcessing}>
            Cancel
          </CancelButton>
          <PayButton onClick={handlePayment} disabled={isProcessing || !scriptLoaded}>
            {isProcessing ? (
              <>
                <DotWaveLoader size={20} color="#ffffff" speed={0.8} />
                Processing...
              </>
            ) : !scriptLoaded ? (
              <>
                <DotWaveLoader size={20} color="#ffffff" speed={0.8} />
                Loading...
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

const PaymentMethods = styled.div`
  margin: 1rem 0;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
`;

const PaymentMethodsTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
`;

const PaymentMethodsList = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const PaymentMethod = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
  
  svg {
    color: #10B981;
  }
`;

const PaymentNote = styled.p`
  font-size: 0.75rem;
  color: #dc2626;
  margin: 0.75rem 0 0 0;
  font-weight: 500;
  text-align: center;
`;

const CompletedMessage = styled.div`
  text-align: center;
  padding: 2rem 0;
`;

const CompletedTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #10B981;
  margin: 1rem 0 0.5rem 0;
`;

const CompletedDescription = styled.p`
  color: #64748b;
  margin: 0 0 2rem 0;
  line-height: 1.6;
`;

const PaymentDetails = styled.div`
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
  text-align: left;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.span`
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
`;

const DetailValue = styled.span`
  font-size: 0.875rem;
  color: #1e293b;
  font-weight: 600;
`;

const ErrorBox = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
  margin: 1rem 0;
`;

const ErrorText = styled.p`
  font-size: 0.875rem;
  color: #dc2626;
  margin: 0;
  line-height: 1.5;
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

  &:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #d1d5db;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
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
`;

export default LendingFeePaymentModal;