import React, { useState } from 'react';
import styled from 'styled-components';
import { X, Calendar, MapPin, Users, Image, Tag, Link as LinkIcon, Mail, Phone, Loader } from 'lucide-react';
import { organizerAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import RegistrationFieldsManager from './RegistrationFieldsManager';

const CreateEventModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [registrationFields, setRegistrationFields] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'other',
    startAt: '',
    endAt: '',
    address: '',
    venue: '',
    latitude: '',
    longitude: '',
    capacity: 0,
    status: 'draft',
    isPublic: true,
    registrationRequired: false,
    tags: '',
    externalLink: '',
    contactEmail: '',
    contactPhone: ''
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toast.error('Event title is required');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Event description is required');
      return;
    }
    if (!formData.startAt) {
      toast.error('Start date and time is required');
      return;
    }
    if (!formData.endAt) {
      toast.error('End date and time is required');
      return;
    }
    if (new Date(formData.endAt) <= new Date(formData.startAt)) {
      toast.error('End date must be after start date');
      return;
    }
    if (!formData.address.trim()) {
      toast.error('Event address is required');
      return;
    }
    if (!formData.latitude || !formData.longitude) {
      toast.error('Location coordinates are required');
      return;
    }

    setLoading(true);
    try {
      // Prepare data for API
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        eventType: formData.eventType,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
        location: {
          type: 'Point',
          coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)],
          address: formData.address.trim(),
          venue: formData.venue.trim()
        },
        capacity: parseInt(formData.capacity) || 0,
        status: formData.status,
        isPublic: formData.isPublic,
        registrationRequired: formData.registrationRequired,
        registrationFields: registrationFields,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        externalLink: formData.externalLink.trim(),
        contactEmail: formData.contactEmail.trim(),
        contactPhone: formData.contactPhone.trim()
      };

      await organizerAPI.createEvent(eventData);
      toast.success('Event created successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }));
          toast.success('Location captured!');
        },
        (error) => {
          toast.error('Failed to get location. Please enter manually.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>Create New Event</h2>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <Section>
            <SectionTitle>Basic Information</SectionTitle>
            
            <FormGroup>
              <Label>Event Title *</Label>
              <Input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Summer Book Reading Festival"
                maxLength={200}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Description *</Label>
              <TextArea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your event in detail..."
                rows={4}
                maxLength={5000}
                required
              />
              <CharCount>{formData.description.length}/5000</CharCount>
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label>Event Type *</Label>
                <Select name="eventType" value={formData.eventType} onChange={handleChange}>
                  <option value="workshop">Workshop</option>
                  <option value="book-reading">Book Reading</option>
                  <option value="author-meetup">Author Meetup</option>
                  <option value="book-club">Book Club</option>
                  <option value="literary-festival">Literary Festival</option>
                  <option value="book-launch">Book Launch</option>
                  <option value="discussion">Discussion</option>
                  <option value="other">Other</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Capacity</Label>
                <Input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="0 = Unlimited"
                  min="0"
                />
              </FormGroup>
            </FormRow>
          </Section>

          <Section>
            <SectionTitle>Date & Time</SectionTitle>
            
            <FormRow>
              <FormGroup>
                <Label>Start Date & Time *</Label>
                <Input
                  type="datetime-local"
                  name="startAt"
                  value={formData.startAt}
                  onChange={handleChange}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>End Date & Time *</Label>
                <Input
                  type="datetime-local"
                  name="endAt"
                  value={formData.endAt}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
            </FormRow>
          </Section>

          <Section>
            <SectionTitle>Location</SectionTitle>
            
            <FormGroup>
              <Label>Address *</Label>
              <Input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g., 123 Main St, City, State, ZIP"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Venue Name</Label>
              <Input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="e.g., Central Library, Conference Hall"
              />
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label>Latitude *</Label>
                <Input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="e.g., 40.7128"
                  step="any"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Longitude *</Label>
                <Input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="e.g., -74.0060"
                  step="any"
                  required
                />
              </FormGroup>
            </FormRow>

            <LocationButton type="button" onClick={getCurrentLocation}>
              <MapPin size={18} />
              Use My Current Location
            </LocationButton>
          </Section>

          <Section>
            <SectionTitle>Additional Details</SectionTitle>
            
            <FormGroup>
              <Label>Tags (comma-separated)</Label>
              <Input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g., fiction, classics, discussion"
              />
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="contact@example.com"
                />
              </FormGroup>

              <FormGroup>
                <Label>Contact Phone</Label>
                <Input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="+1 234 567 8900"
                />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label>External Link</Label>
              <Input
                type="url"
                name="externalLink"
                value={formData.externalLink}
                onChange={handleChange}
                placeholder="https://example.com/event"
              />
            </FormGroup>
          </Section>

          <Section>
            <SectionTitle>Settings</SectionTitle>
            
            <FormRow>
              <FormGroup>
                <Label>Status *</Label>
                <Select name="status" value={formData.status} onChange={handleChange}>
                  <option value="draft">Draft (Not visible to public)</option>
                  <option value="published">Published (Visible to public)</option>
                </Select>
              </FormGroup>
            </FormRow>

            <CheckboxGroup>
              <Checkbox
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleChange}
              />
              <Label>Make this event public</Label>
            </CheckboxGroup>

            <CheckboxGroup>
              <Checkbox
                type="checkbox"
                name="registrationRequired"
                checked={formData.registrationRequired}
                onChange={handleChange}
              />
              <Label>Require registration to attend</Label>
            </CheckboxGroup>
          </Section>

          {formData.registrationRequired && (
            <Section>
              <RegistrationFieldsManager
                fields={registrationFields}
                onChange={setRegistrationFields}
              />
            </Section>
          )}

          <ModalFooter>
            <CancelButton type="button" onClick={onClose}>
              Cancel
            </CancelButton>
            <SubmitButton type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader size={18} className="spinner" />
                  Creating...
                </>
              ) : (
                'Create Event'
              )}
            </SubmitButton>
          </ModalFooter>
        </Form>
      </ModalContainer>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  overflow-y: auto;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
    color: #1e293b;
  }
`;

const Form = styled.form`
  padding: 1.5rem;
`;

const Section = styled.div`
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e2e8f0;

  &:last-of-type {
    border-bottom: none;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4F46E5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4F46E5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4F46E5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const CharCount = styled.span`
  display: block;
  text-align: right;
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
`;

const LocationButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f1f5f9;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  color: #4F46E5;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e2e8f0;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const Checkbox = styled.input`
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  color: #374151;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
  }
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #4F46E5;
  border: none;
  border-radius: 0.5rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #4338ca;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export default CreateEventModal;
