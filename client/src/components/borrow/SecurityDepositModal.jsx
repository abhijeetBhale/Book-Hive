import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Shield, Loader, Lock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const SecurityDepositModal = ({ isOpen, onClose, onSuccess, amount, bookTitle, requestId }) => {
    const [loading, setLoading] = useState(false);

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
            // Get API URL
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

            // Create order
            const response = await fetch(`${apiUrl}/payment/create-deposit-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    amount,
                    requestId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create deposit order');
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
                description: `Security Deposit for ${bookTitle}`,
                order_id: data.order.id,
                handler: async function (response) {
                    try {
                        // Verify payment
                        const verifyResponse = await fetch(`${apiUrl}/payment/verify-deposit-payment`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                requestId
                            })
                        });

                        const verifyData = await verifyResponse.json();

                        if (verifyData.success) {
                            toast.success('🎉 Security deposit paid successfully!');
                            if (onSuccess) onSuccess();
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
                    ondismiss: function () {
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
                    <IconWrapper>
                        <Lock size={40} color="#4F46E5" />
                    </IconWrapper>
                    <h2>Security Deposit Required</h2>
                    <Price>₹{amount}</Price>
                    <Subtitle>Refundable upon safe return of the book</Subtitle>
                </Header>

                <InfoSection>
                    <InfoItem>
                        <AlertCircle size={20} color="#f59e0b" />
                        <p>
                            This deposit is held securely by BookHive and will be refunded to your original payment method once the owner confirms the book is returned in good condition.
                        </p>
                    </InfoItem>
                </InfoSection>

                <BookInfo>
                    <strong>Book:</strong> {bookTitle}
                </BookInfo>

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
                                <Lock size={16} />
                                Pay Deposit
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
  max-width: 450px;
  width: 100%;
  position: relative;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
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

const IconWrapper = styled.div`
  display: inline-flex;
  padding: 1rem;
  background: #eef2ff;
  border-radius: 50%;
  margin-bottom: 0.5rem;
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

const InfoSection = styled.div`
  padding: 1.5rem 2rem;
  background: #fffbeb;
`;

const InfoItem = styled.div`
  display: flex;
  gap: 1rem;
  align-items: start;
  color: #92400e;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const BookInfo = styled.div`
  padding: 1rem 2rem;
  text-align: center;
  color: #374151;
  font-size: 1rem;
  border-bottom: 1px solid #e5e7eb;
`;

const SecurityNote = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f9fafb;
  color: #6b7280;
  font-size: 0.875rem;
`;

const Actions = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1.5rem 2rem;
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
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export default SecurityDepositModal;
