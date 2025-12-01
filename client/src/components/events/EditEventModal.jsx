import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Calendar, MapPin, Users, Tag, Link as LinkIcon, Mail, Phone, Loader } from 'lucide-react';
import { organizerAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import RegistrationFieldsManager from './RegistrationFieldsManager';

const EditEventModal = ({ isOpen, onClose, onSuccess, event }) => {
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

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        eventType: event.eventType || 'other',
        startAt: event.startAt ? new Date(event.startAt).toISOString().slice(0, 16) : '',
        endAt: event.endAt ? new Date(event.endAt).toISOString().slice(0, 16) : '',
        address: event.address || '',
        venue: event.location?.venue || '',
        latitude: event.location?.coordinates?.[1] || '',
        longitude: event.location?.coordinates?.[0] || '',
        capacity: event.capacity || 0,
        status: event.status || 'draft',
        isPublic: event.isPublic !== false,
        registrationRequired: event.registrationRequired || false,
        tags: event.tags?.join(', ') || '',
        externalLink: event.externalLink || '',
        contactEmail: event.contactEmail || '',
        contactPhone: event.contactPhone || ''
      });
      setRegistrationFields(event.registrationFields || []);
    }
  }, [event]);

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
    
    if (!formData.title.trim()) {
      toast.error('Event title is required');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Event description is required');
      return;
    }

    setLoading(true);
    try {
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        eventType: formData.eventType,
        startAt: formData.startAt,
        endAt: formData.endAt,
        address: formData.address.trim(),
        location: {
          venue: formData.venue.trim(),
          address: formData.address.trim(),
          coordinates: formData.latitude && formData.longitude 
            ? [parseFloat(formData.longitude), parseFloat(formData.latitude)]
            : undefined
        },
        capacity: parseInt(formData.capacity) || 0,
        status: formData.status,
        isPublic: formData.isPublic,
        registrationRequired: formData.registrationRequired,
        registrationFields: registrationFields,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        externalLink: formData.externalLink.trim(),
        contactEmail: formData.contactEmail.trim(),
        contactPhone: formData.contactPhone.trim()
      };

      await organizerAPI.updateEvent(event._id, eventData);
      toast.success('Event updated successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <h2>Edit Event</h2>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </Header>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Event Title *</Label>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter event title"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Description *</Label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your event"
              rows={4}
              required
            />
          </FormGroup>

          <FormRow>
            <FormGroup>
              <Label>Event Type *</Label>
              <Select name="eventType" value={formData.eventType} onChange={handleChange}>
                <option value="book-club">Book Club</option>
                <option value="reading-session">Reading Session</option>
                <option value="author-meetup">Author Meetup</option>
                <option value="book-swap">Book Swap</option>
                <option value="workshop">Workshop</option>
                <option value="other">Other</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Status *</Label>
              <Select name="status" value={formData.status} onChange={handleChange}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </FormGroup>
          </FormRow>

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

          <FormGroup>
            <Label>Venue Name</Label>
            <Input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              placeholder="e.g., City Library"
            />
          </FormGroup>

          <FormGroup>
            <Label>Address *</Label>
            <Input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Full address"
              required
            />
          </FormGroup>

          <FormRow>
            <FormGroup>
              <Label>Latitude</Label>
              <Input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="e.g., 19.0760"
              />
            </FormGroup>

            <FormGroup>
              <Label>Longitude</Label>
              <Input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="e.g., 72.8777"
              />
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label>Capacity (0 for unlimited)</Label>
            <Input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              min="0"
            />
          </FormGroup>

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

          <FormGroup>
            <Label>External Link</Label>
            <Input
              type="url"
              name="externalLink"
              value={formData.externalLink}
              onChange={handleChange}
              placeholder="https://..."
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
                placeholder="+91 1234567890"
              />
            </FormGroup>
          </FormRow>

          <CheckboxGroup>
            <Checkbox>
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleChange}
              />
              <span>Make event public</span>
            </Checkbox>

            <Checkbox>
              <input
                type="checkbox"
                name="registrationRequired"
                checked={formData.registrationRequired}
                onChange={handleChange}
              />
              <span>Require registration</span>
            </Checkbox>
          </CheckboxGroup>

          {formData.registrationRequired && (
            <RegistrationFieldsManager
              fields={registrationFields}
              onChange={setRegistrationFields}
            />
          )}

          <Actions>
            <CancelButton type="button" onClick={onClose}>
              Cancel
            </CancelButton>
            <SubmitButton type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader className="spin" size={18} />
                  Updating...
                </>
              ) : (
                'Update Event'
              )}
            </SubmitButton>
          </Actions>
        </Form>
      </Modal>
    </Overlay>
  );
};

// Styled Components (reusing from CreateEventModal)
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
  max-width: 800px;
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
  align-items: center;

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }
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

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
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
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
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
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
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

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Checkbox = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;

  input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  span {
    font-size: 0.875rem;
    color: #374151;
  }
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

export default EditEventModal;
