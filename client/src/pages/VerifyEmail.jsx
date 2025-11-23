import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { CheckCircle, XCircle, Loader, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error, already_verified
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. Please check your email and try again.');
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/auth/verify-email/${token}`);
        const data = await response.json();

        if (data.success) {
          if (data.alreadyVerified) {
            setStatus('already_verified');
            setMessage('Your email is already verified!');
          } else {
            setStatus('success');
            setMessage(data.message || 'Email verified successfully!');
            toast.success('✓ Email verified! You now have the "Contact Verified" badge.');
          }
          
          // Redirect to profile after 3 seconds
          setTimeout(() => {
            navigate('/profile');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed. Please try again.');
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage('Something went wrong. Please try again later.');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  const handleGoToProfile = () => {
    navigate('/profile');
  };

  const handleResendEmail = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const authToken = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Verification email sent! Please check your inbox.');
      } else {
        toast.error(data.message || 'Failed to resend email');
      }
    } catch (error) {
      console.error('Resend email error:', error);
      toast.error('Failed to resend email. Please try again.');
    }
  };

  return (
    <Container>
      <Card>
        {status === 'verifying' && (
          <>
            <IconWrapper color="#4F46E5">
              <Loader className="spin" size={64} />
            </IconWrapper>
            <Title>Verifying Your Email...</Title>
            <Message>Please wait while we verify your email address.</Message>
          </>
        )}

        {status === 'success' && (
          <>
            <IconWrapper color="#10b981">
              <CheckCircle size={64} />
            </IconWrapper>
            <Title>Email Verified!</Title>
            <Message>{message}</Message>
            <BadgePreview>
              <CheckCircle size={20} color="#10b981" />
              <span>Contact Verified</span>
            </BadgePreview>
            <InfoBox>
              <p>✓ You now have the "Contact Verified" badge on your profile</p>
              <p>✓ Build trust with other BookHive members</p>
              <p>✓ Receive important notifications about your books</p>
            </InfoBox>
            <Button onClick={handleGoToProfile}>Go to Profile</Button>
            <RedirectMessage>Redirecting to your profile in 3 seconds...</RedirectMessage>
          </>
        )}

        {status === 'already_verified' && (
          <>
            <IconWrapper color="#10b981">
              <CheckCircle size={64} />
            </IconWrapper>
            <Title>Already Verified</Title>
            <Message>{message}</Message>
            <Button onClick={handleGoToProfile}>Go to Profile</Button>
          </>
        )}

        {status === 'error' && (
          <>
            <IconWrapper color="#ef4444">
              <XCircle size={64} />
            </IconWrapper>
            <Title>Verification Failed</Title>
            <Message>{message}</Message>
            <ButtonGroup>
              <Button onClick={handleResendEmail}>
                <Mail size={18} />
                Resend Verification Email
              </Button>
              <SecondaryButton onClick={handleGoToProfile}>
                Go to Profile
              </SecondaryButton>
            </ButtonGroup>
          </>
        )}
      </Card>
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  padding: 3rem;
  max-width: 500px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const IconWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${props => `${props.color}15`};
  color: ${props => props.color};
  margin-bottom: 2rem;

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

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1rem;
`;

const Message = styled.p`
  font-size: 1.125rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const BadgePreview = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #d1fae5;
  color: #10b981;
  border-radius: 20px;
  font-weight: 600;
  margin-bottom: 1.5rem;
`;

const InfoBox = styled.div`
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: left;

  p {
    color: #374151;
    margin: 0.5rem 0;
    font-size: 0.9rem;
    line-height: 1.6;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const SecondaryButton = styled(Button)`
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;

  &:hover {
    background: #f9fafb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const RedirectMessage = styled.p`
  font-size: 0.875rem;
  color: #9ca3af;
  margin-top: 1rem;
`;

export default VerifyEmail;
