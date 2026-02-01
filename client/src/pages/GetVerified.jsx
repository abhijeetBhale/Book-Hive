import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { BadgeCheck, ArrowLeft, Loader, CheckCircle, Shield, Star, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import SEO from '../components/SEO';

const GetVerified = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [existingApplication, setExistingApplication] = useState(null);
  
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    reason: ''
  });

  useEffect(() => {
    checkApplicationStatus();
  }, []);

  const checkApplicationStatus = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/verification/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (data.data.isVerified) {
          toast.success('You are already verified!');
          navigate('/profile');
          return;
        }
        
        if (data.data.application) {
          setExistingApplication(data.data.application);
        }
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/verification/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode
          },
          reason: formData.reason
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Application submitted successfully! We will review it shortly.');
        navigate('/profile');
      } else {
        toast.error(data.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <LoadingContainer>
        <Loader className="spin" size={48} />
        <p>Checking verification status...</p>
      </LoadingContainer>
    );
  }

  if (existingApplication) {
    return (
      <Container>
        <SEO 
          title="Verification Application Status"
          description="Check your verification application status"
        />
        <BackButton onClick={() => navigate('/profile')}>
          <ArrowLeft size={20} />
          Back to Profile
        </BackButton>

        <StatusCard status={existingApplication.status}>
          <StatusIcon>
            {existingApplication.status === 'pending' && <Loader className="spin" size={48} />}
            {existingApplication.status === 'approved' && <CheckCircle size={48} />}
            {existingApplication.status === 'rejected' && <Shield size={48} />}
          </StatusIcon>
          
          <StatusTitle>
            {existingApplication.status === 'pending' && 'Application Under Review'}
            {existingApplication.status === 'approved' && 'Application Approved!'}
            {existingApplication.status === 'rejected' && 'Application Reviewed'}
          </StatusTitle>
          
          <StatusMessage>
            {existingApplication.status === 'pending' && 
              'Your verification application is being reviewed by our team. We will notify you once the review is complete.'}
            {existingApplication.status === 'approved' && 
              'Congratulations! Your verification badge has been activated.'}
            {existingApplication.status === 'rejected' && existingApplication.rejectionReason}
          </StatusMessage>

          {existingApplication.status === 'rejected' && (
            <ReapplyButton onClick={() => setExistingApplication(null)}>
              Apply Again
            </ReapplyButton>
          )}
        </StatusCard>
      </Container>
    );
  }

  return (
    <Container>
      <SEO 
        title="Get Verified Badge"
        description="Apply for a verified badge on BookHive"
      />
      
      <BackButton onClick={() => navigate('/profile')}>
        <ArrowLeft size={20} />
        Back to Profile
      </BackButton>

      <Header>
        <BadgeIcon>
          <BadgeCheck size={64} color="#1a87db" fill="#ffffffff" />
        </BadgeIcon>
        <Title>Get Verified on BookHive</Title>
        <Subtitle>Apply for a verified badge to unlock premium features</Subtitle>
      </Header>

      <Benefits>
        <BenefitCard>
          <BadgeCheck size={24} color="#1a87db" style={{marginLeft: '80px'}}/>
          <BenefitTitle>Verified Badge</BenefitTitle>
          <BenefitText>Blue checkmark on your profile</BenefitText>
        </BenefitCard>
        <BenefitCard>
          <Zap size={24} color="#f59e0b" style={{marginLeft: '80px'}}/>
          <BenefitTitle>Search Boost</BenefitTitle>
          <BenefitText>Higher visibility in searches</BenefitText>
        </BenefitCard>
        <BenefitCard>
          <Star size={24} color="#10b981" style={{marginLeft: '80px'}} />
          <BenefitTitle>Priority Queue</BenefitTitle>
          <BenefitText>Priority borrow requests</BenefitText>
        </BenefitCard>
      </Benefits>

      <FormCard>
        <FormTitle>Application Form</FormTitle>
        <Form onSubmit={handleSubmit}>
          <FormRow>
            <FormGroup>
              <Label>Full Name *</Label>
              <Input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </FormGroup>
            <FormGroup>
              <Label>Email *</Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label>Phone Number *</Label>
            <Input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="Enter your phone number"
            />
          </FormGroup>

          <FormGroup>
            <Label>Street Address *</Label>
            <Input
              type="text"
              name="street"
              value={formData.street}
              onChange={handleChange}
              required
              placeholder="Enter your street address"
            />
          </FormGroup>

          <FormRow>
            <FormGroup>
              <Label>City *</Label>
              <Input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                placeholder="Enter your city"
              />
            </FormGroup>
            <FormGroup>
              <Label>State *</Label>
              <Input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                placeholder="Enter your state"
              />
            </FormGroup>
            <FormGroup>
              <Label>Pincode *</Label>
              <Input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                required
                placeholder="Enter pincode"
                pattern="[0-9]{6}"
                title="Please enter a valid 6-digit pincode"
              />
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label>Why do you want to get verified? *</Label>
            <Textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              placeholder="Tell us why you want to get verified on BookHive (max 500 characters)"
              maxLength={500}
              rows={4}
            />
            <CharCount>{formData.reason.length}/500</CharCount>
          </FormGroup>

          <SubmitButton type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader className="spin" size={20} />
                Submitting...
              </>
            ) : (
              <>
                <BadgeCheck size={20} />
                Submit Application
              </>
            )}
          </SubmitButton>
        </Form>
      </FormCard>
    </Container>
  );
};

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 1rem;
  color: #6b7280;

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 2rem;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const BadgeIcon = styled.div`
  display: inline-flex;
  padding: 1.5rem;
  background: #eff6ff;
  border-radius: 50%;
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: #6b7280;
`;

const Benefits = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 3rem;
`;

const BenefitCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  text-align: center;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const BenefitTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0.75rem 0 0.25rem;
`;

const BenefitText = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const FormCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const FormTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4F46E5;
    ring: 2px;
    ring-color: rgba(79, 70, 229, 0.2);
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4F46E5;
    ring: 2px;
    ring-color: rgba(79, 70, 229, 0.2);
  }
`;

const CharCount = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  text-align: right;
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

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

const StatusCard = styled.div`
  background: white;
  padding: 3rem;
  border-radius: 16px;
  border: 2px solid ${props => 
    props.status === 'pending' ? '#fbbf24' :
    props.status === 'approved' ? '#10b981' :
    '#ef4444'
  };
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const StatusIcon = styled.div`
  display: inline-flex;
  padding: 1.5rem;
  background: ${props => 
    props.status === 'pending' ? '#fef3c7' :
    props.status === 'approved' ? '#d1fae5' :
    '#fee2e2'
  };
  border-radius: 50%;
  margin-bottom: 1.5rem;
  color: ${props => 
    props.status === 'pending' ? '#f59e0b' :
    props.status === 'approved' ? '#10b981' :
    '#ef4444'
  };

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const StatusTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1rem;
`;

const StatusMessage = styled.p`
  font-size: 1.125rem;
  color: #6b7280;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
`;

const ReapplyButton = styled.button`
  margin-top: 2rem;
  padding: 0.75rem 1.5rem;
  background: #4F46E5;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #4338ca;
    transform: translateY(-1px);
  }
`;

export default GetVerified;
