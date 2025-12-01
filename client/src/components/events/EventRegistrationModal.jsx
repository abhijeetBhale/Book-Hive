import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { eventsAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const EventRegistrationModal = ({ isOpen, onClose, event, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    consentGiven: false,
    customFields: {}
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && event) {
      // Reset form when modal opens
      setFormData({
        phone: '',
        consentGiven: false,
        customFields: {}
      });
      setErrors({});
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'consentGiven') {
      setFormData(prev => ({
        ...prev,
        consentGiven: checked
      }));
    } else if (name === 'phone') {
      setFormData(prev => ({
        ...prev,
        phone: value
      }));
    } else {
      // Custom field
      setFormData(prev => ({
        ...prev,
        customFields: {
          ...prev.customFields,
          [name]: type === 'checkbox' ? checked : value
        }
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate phone
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    // Validate consent
    if (!formData.consentGiven) {
      newErrors.consentGiven = 'You must consent to share your information';
    }

    // Validate custom fields
    if (event.registrationFields && event.registrationFields.length > 0) {
      event.registrationFields.forEach(field => {
        if (field.required && !formData.customFields[field.fieldName]) {
          newErrors[field.fieldName] = `${field.label} is required`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await eventsAPI.registerForEvent(event._id, formData);
      toast.success('Successfully registered for event!');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register for event');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    const value = formData.customFields[field.fieldName] || '';
    const error = errors[field.fieldName];

    switch (field.fieldType) {
      case 'textarea':
        return (
          <FormGroup key={field.fieldName}>
            <Label>
              {field.label}
              {field.required && <Required>*</Required>}
            </Label>
            <Textarea
              name={field.fieldName}
              value={value}
              onChange={handleChange}
              placeholder={field.placeholder}
              rows={4}
              $hasError={!!error}
            />
            {error && <ErrorText>{error}</ErrorText>}
          </FormGroup>
        );

      case 'select':
        return (
          <FormGroup key={field.fieldName}>
            <Label>
              {field.label}
              {field.required && <Required>*</Required>}
            </Label>
            <Select
              name={field.fieldName}
              value={value}
              onChange={handleChange}
              $hasError={!!error}
            >
              <option value="">Select an option</option>
              {field.options?.map((option, idx) => (
                <option key={idx} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            {error && <ErrorText>{error}</ErrorText>}
          </FormGroup>
        );

      case 'checkbox':
        return (
          <CheckboxGroup key={field.fieldName}>
            <CheckboxLabel>
              <input
                type="checkbox"
                name={field.fieldName}
                checked={!!value}
                onChange={handleChange}
              />
              <span>
                {field.label}
                {field.required && <Required>*</Required>}
              </span>
            </CheckboxLabel>
            {error && <ErrorText>{error}</ErrorText>}
          </CheckboxGroup>
        );

      default:
        return (
          <FormGroup key={field.fieldName}>
            <Label>
              {field.label}
              {field.required && <Required>*</Required>}
            </Label>
            <Input
              type={field.fieldType}
              name={field.fieldName}
              value={value}
              onChange={handleChange}
              placeholder={field.placeholder}
              $hasError={!!error}
            />
            {error && <ErrorText>{error}</ErrorText>}
          </FormGroup>
        );
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <div>
            <h2>Register for Event</h2>
            <EventTitle>{event.title}</EventTitle>
          </div>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </Header>

        <Form onSubmit={handleSubmit}>
          <InfoBox>
            <CheckCircle size={20} />
            <div>
              <strong>Event Details</strong>
              <p>Please provide your information to register for this event. Your details will be shared with the event organizer.</p>
            </div>
          </InfoBox>

          {/* Phone Number (Always Required) */}
          <FormGroup>
            <Label>
              Phone Number
              <Required>*</Required>
            </Label>
            <Input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 1234567890"
              $hasError={!!errors.phone}
            />
            {errors.phone && <ErrorText>{errors.phone}</ErrorText>}
          </FormGroup>

          {/* Custom Registration Fields */}
          {event.registrationFields && event.registrationFields.length > 0 && (
            <>
              <Divider />
              <SectionTitle>Additional Information</SectionTitle>
              {event.registrationFields
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map(field => renderField(field))}
            </>
          )}

          {/* Consent Checkbox */}
          <Divider />
          <CheckboxGroup>
            <CheckboxLabel $hasError={!!errors.consentGiven}>
              <input
                type="checkbox"
                name="consentGiven"
                checked={formData.consentGiven}
                onChange={handleChange}
              />
              <span>
                I consent to share my contact information with the event organizer
                <Required>*</Required>
              </span>
            </CheckboxLabel>
            {errors.consentGiven && <ErrorText>{errors.consentGiven}</ErrorText>}
          </CheckboxGroup>

          <WarningBox>
            <AlertCircle size={18} />
            <span>By registering, you agree to receive event updates and communications from the organizer.</span>
          </WarningBox>

          <Actions>
            <CancelButton type="button" onClick={onClose}>
              Cancel
            </CancelButton>
            <SubmitButton type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader className="spin" size={18} />
                  Registering...
                </>
              ) : (
                'Register for Event'
              )}
            </SubmitButton>
          </Actions>
        </Form>
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
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const Header = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: start;

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.25rem 0;
  }
`;

const EventTitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const CloseButton = styled.button`
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

const Form = styled.form`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const InfoBox = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  color: #1e40af;

  svg {
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  strong {
    display: block;
    margin-bottom: 0.25rem;
  }

  p {
    margin: 0;
    font-size: 0.875rem;
    color: #1e3a8a;
  }
`;

const WarningBox = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 8px;
  color: #92400e;
  font-size: 0.875rem;

  svg {
    flex-shrink: 0;
    margin-top: 0.125rem;
  }
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
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const Required = styled.span`
  color: #dc2626;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid ${props => props.$hasError ? '#dc2626' : '#d1d5db'};
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#dc2626' : '#4F46E5'};
    box-shadow: 0 0 0 3px ${props => props.$hasError ? 'rgba(220, 38, 38, 0.1)' : 'rgba(79, 70, 229, 0.1)'};
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid ${props => props.$hasError ? '#dc2626' : '#d1d5db'};
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#dc2626' : '#4F46E5'};
    box-shadow: 0 0 0 3px ${props => props.$hasError ? 'rgba(220, 38, 38, 0.1)' : 'rgba(79, 70, 229, 0.1)'};
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid ${props => props.$hasError ? '#dc2626' : '#d1d5db'};
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#dc2626' : '#4F46E5'};
    box-shadow: 0 0 0 3px ${props => props.$hasError ? 'rgba(220, 38, 38, 0.1)' : 'rgba(79, 70, 229, 0.1)'};
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: start;
  gap: 0.5rem;
  cursor: pointer;
  color: ${props => props.$hasError ? '#dc2626' : '#374151'};

  input {
    width: 18px;
    height: 18px;
    cursor: pointer;
    margin-top: 0.125rem;
    flex-shrink: 0;
  }

  span {
    font-size: 0.875rem;
    line-height: 1.5;
  }
`;

const ErrorText = styled.span`
  font-size: 0.75rem;
  color: #dc2626;
  margin-top: -0.25rem;
`;

const Divider = styled.div`
  height: 1px;
  background: #e5e7eb;
  margin: 0.5rem 0;
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
`;

const Actions = styled.div`
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
  }
`;

const SubmitButton = styled.button`
  flex: 2;
  padding: 0.75rem;
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

export default EventRegistrationModal;
