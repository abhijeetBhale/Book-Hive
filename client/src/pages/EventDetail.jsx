import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { eventsAPI } from '../utils/api';
import styled from 'styled-components';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Check, X, Loader, Tag, ExternalLink, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [phone, setPhone] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    fetchEvent();
    if (user) {
      checkRegistrationStatus();
    }
  }, [id, user]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getEventById(id);
      setEvent(response.data);
    } catch (error) {
      console.error('Failed to fetch event:', error);
      toast.error('Failed to load event details');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    try {
      const response = await eventsAPI.getMyRegistrations();
      const registered = response.data.some(reg => reg.event._id === id);
      setIsRegistered(registered);
    } catch (error) {
      console.error('Failed to check registration status:', error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to register for events');
      navigate('/login');
      return;
    }

    if (!consentGiven) {
      toast.error('Please consent to share your information');
      return;
    }

    try {
      setRegistering(true);
      await eventsAPI.registerForEvent(id, { phone, consentGiven });
      toast.success('Successfully registered for event!');
      setIsRegistered(true);
      setShowRegistrationForm(false);
      fetchEvent(); // Refresh to update registration count
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error(error.response?.data?.message || 'Failed to register for event');
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!confirm('Are you sure you want to cancel your registration?')) return;

    try {
      await eventsAPI.cancelRegistration(id);
      toast.success('Registration cancelled');
      setIsRegistered(false);
      fetchEvent();
    } catch (error) {
      console.error('Failed to cancel registration:', error);
      toast.error('Failed to cancel registration');
    }
  };

  if (loading) {
    return (
      <StyledWrapper>
        <div className="loading-container">
          <Loader className="spinner" size={48} />
          <p>Loading event...</p>
        </div>
      </StyledWrapper>
    );
  }

  if (!event) {
    return null;
  }

  const isFull = event.capacity > 0 && event.currentRegistrations >= event.capacity;
  const isPast = new Date(event.endAt) < new Date();

  return (
    <StyledWrapper>
      <button onClick={() => navigate('/events')} className="back-btn">
        <ArrowLeft size={20} />
        Back to Events
      </button>

      <div className="event-container">
        {event.coverImage?.url && (
          <div className="event-hero">
            <img src={event.coverImage.url} alt={event.title} />
          </div>
        )}

        <div className="event-content">
          <div className="event-header">
            <div className="event-type">{event.eventType.replace('-', ' ')}</div>
            <h1>{event.title}</h1>
            
            <div className="event-meta">
              <div className="meta-item">
                <Calendar size={20} />
                <span>{format(new Date(event.startAt), 'EEEE, MMMM dd, yyyy')}</span>
              </div>
              <div className="meta-item">
                <Clock size={20} />
                <span>
                  {format(new Date(event.startAt), 'h:mm a')} - {format(new Date(event.endAt), 'h:mm a')}
                </span>
              </div>
              <div className="meta-item">
                <MapPin size={20} />
                <span>{event.location.address}</span>
              </div>
              {event.capacity > 0 && (
                <div className="meta-item">
                  <Users size={20} />
                  <span>{event.currentRegistrations} / {event.capacity} registered</span>
                </div>
              )}
            </div>
          </div>

          <div className="event-description">
            <h2>About This Event</h2>
            <p>{event.description}</p>
          </div>

          {event.tags && event.tags.length > 0 && (
            <div className="event-tags">
              <h3>Tags</h3>
              <div className="tags-list">
                {event.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    <Tag size={14} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {event.externalLink && (
            <div className="external-link">
              <a href={event.externalLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={18} />
                Visit Event Website
              </a>
            </div>
          )}

          <div className="organizer-info">
            <h3>Organized By</h3>
            <div className="organizer-card">
              <img 
                src={event.organizer.avatar || `https://ui-avatars.com/api/?name=${event.organizer.name}`} 
                alt={event.organizer.name}
              />
              <div>
                <h4>{event.organizer.organizerProfile?.organizationName || event.organizer.name}</h4>
                <p>{event.organizer.organizerProfile?.organizationType || 'Event Organizer'}</p>
              </div>
            </div>
          </div>

          <div className="registration-section">
            {isPast ? (
              <div className="alert alert-info">
                This event has ended
              </div>
            ) : isRegistered ? (
              <div className="registered-status">
                <div className="alert alert-success">
                  <Check size={20} />
                  You're registered for this event!
                </div>
                <button onClick={handleCancelRegistration} className="btn-cancel">
                  Cancel Registration
                </button>
              </div>
            ) : isFull ? (
              <div className="alert alert-warning">
                <X size={20} />
                This event is full
              </div>
            ) : !showRegistrationForm ? (
              <button 
                onClick={() => user ? setShowRegistrationForm(true) : navigate('/login')} 
                className="btn-register"
              >
                Register for Event
              </button>
            ) : (
              <form onSubmit={handleRegister} className="registration-form">
                <h3>Complete Your Registration</h3>
                
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" value={user?.name || ''} disabled />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={user?.email || ''} disabled />
                </div>

                <div className="form-group">
                  <label>Phone (Optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Your phone number"
                  />
                </div>

                <div className="consent-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={consentGiven}
                      onChange={(e) => setConsentGiven(e.target.checked)}
                      required
                    />
                    <span>
                      I consent to share my name and contact details with the event organizer 
                      for event coordination purposes.
                    </span>
                  </label>
                </div>

                <div className="form-actions">
                  <button type="submit" disabled={registering || !consentGiven} className="btn-submit">
                    {registering ? 'Registering...' : 'Confirm Registration'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowRegistrationForm(false)} 
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;

  .back-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    color: #64748b;
    cursor: pointer;
    margin-bottom: 1.5rem;
    transition: all 0.2s;

    &:hover {
      border-color: #4F46E5;
      color: #4F46E5;
    }
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;

    .spinner {
      color: #4F46E5;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  }

  .event-container {
    background: white;
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .event-hero {
      width: 100%;
      height: 400px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .event-content {
      padding: 2rem;

      .event-header {
        margin-bottom: 2rem;

        .event-type {
          display: inline-block;
          padding: 0.375rem 1rem;
          background: #4F46E5;
          color: white;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }

        h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 1.5rem;
        }

        .event-meta {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            color: #64748b;
            font-size: 1rem;

            svg {
              flex-shrink: 0;
              color: #4F46E5;
            }
          }
        }
      }

      .event-description {
        margin-bottom: 2rem;

        h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 1rem;
        }

        p {
          color: #475569;
          line-height: 1.7;
          white-space: pre-wrap;
        }
      }

      .event-tags {
        margin-bottom: 2rem;

        h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.75rem;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;

          .tag {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.5rem 1rem;
            background: #f1f5f9;
            color: #475569;
            border-radius: 0.375rem;
            font-size: 0.875rem;
          }
        }
      }

      .external-link {
        margin-bottom: 2rem;

        a {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: #f1f5f9;
          color: #4F46E5;
          border-radius: 0.5rem;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s;

          &:hover {
            background: #e2e8f0;
          }
        }
      }

      .organizer-info {
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: #f8fafc;
        border-radius: 0.75rem;

        h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 1rem;
        }

        .organizer-card {
          display: flex;
          align-items: center;
          gap: 1rem;

          img {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            object-fit: cover;
          }

          h4 {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 0.25rem;
          }

          p {
            color: #64748b;
            font-size: 0.875rem;
            text-transform: capitalize;
          }
        }
      }

      .registration-section {
        padding: 1.5rem;
        background: #f8fafc;
        border-radius: 0.75rem;

        .alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;

          &.alert-success {
            background: #dcfce7;
            color: #166534;
          }

          &.alert-warning {
            background: #fef3c7;
            color: #92400e;
          }

          &.alert-info {
            background: #dbeafe;
            color: #1e40af;
          }
        }

        .registered-status {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .btn-register, .btn-submit {
          width: 100%;
          padding: 1rem;
          background: #4F46E5;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;

          &:hover:not(:disabled) {
            background: #4338ca;
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }

        .btn-cancel {
          width: 100%;
          padding: 0.75rem;
          background: white;
          color: #64748b;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            border-color: #ef4444;
            color: #ef4444;
          }
        }

        .registration-form {
          h3 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 1.5rem;
          }

          .form-group {
            margin-bottom: 1rem;

            label {
              display: block;
              font-size: 0.875rem;
              font-weight: 600;
              color: #334155;
              margin-bottom: 0.5rem;
            }

            input {
              width: 100%;
              padding: 0.75rem;
              border: 1px solid #e2e8f0;
              border-radius: 0.5rem;
              font-size: 1rem;

              &:focus {
                outline: none;
                border-color: #4F46E5;
              }

              &:disabled {
                background: #f1f5f9;
                color: #64748b;
              }
            }
          }

          .consent-group {
            margin: 1.5rem 0;
            padding: 1rem;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;

            .checkbox-label {
              display: flex;
              gap: 0.75rem;
              cursor: pointer;

              input[type="checkbox"] {
                margin-top: 0.25rem;
                width: 18px;
                height: 18px;
                cursor: pointer;
              }

              span {
                font-size: 0.875rem;
                color: #475569;
                line-height: 1.5;
              }
            }
          }

          .form-actions {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin-top: 1.5rem;
          }
        }
      }
    }
  }

  @media (max-width: 768px) {
    padding: 1rem;

    .event-container {
      .event-hero {
        height: 250px;
      }

      .event-content {
        padding: 1.5rem;

        .event-header h1 {
          font-size: 1.75rem;
        }
      }
    }
  }
`;

export default EventDetail;
