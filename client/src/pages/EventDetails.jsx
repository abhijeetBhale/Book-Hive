import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { eventsAPI } from '../utils/api';
import styled from 'styled-components';
import { Calendar, MapPin, Users, Clock, Tag, Link as LinkIcon, Mail, Phone, ArrowLeft, Loader, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import EventRegistrationModal from '../components/events/EventRegistrationModal';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
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

  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  const handleRegister = () => {
    if (!user) {
      toast.error('Please login to register for events');
      navigate('/login');
      return;
    }

    setShowRegistrationModal(true);
  };

  const handleRegistrationSuccess = () => {
    setShowRegistrationModal(false);
    fetchEventDetails(); // Refresh to update registration count
  };

  const getEventTypeColor = (type) => {
    const colors = {
      'workshop': '#8b5cf6',
      'book-reading': '#3b82f6',
      'author-meetup': '#ec4899',
      'book-club': '#10b981',
      'literary-festival': '#f59e0b',
      'book-launch': '#ef4444',
      'discussion': '#6366f1',
      'other': '#6b7280'
    };
    return colors[type] || colors.other;
  };

  if (loading) {
    return (
      <LoadingContainer>
        <Loader className="spinner" size={48} />
        <p>Loading event details...</p>
      </LoadingContainer>
    );
  }

  if (!event) {
    return (
      <ErrorContainer>
        <h2>Event Not Found</h2>
        <p>The event you're looking for doesn't exist or has been removed.</p>
        <BackButton onClick={() => navigate('/events')}>
          <ArrowLeft size={18} />
          Back to Events
        </BackButton>
      </ErrorContainer>
    );
  }

  const isOrganizer = user && event.organizer && (user._id === event.organizer._id || user._id === event.organizer);
  const isFull = event.capacity > 0 && event.currentRegistrations >= event.capacity;
  const isPast = new Date(event.endAt) < new Date();

  return (
    <PageWrapper>
      <BackButton onClick={() => navigate('/events')}>
        <ArrowLeft size={18} />
        Back to Events
      </BackButton>

      <ContentGrid>
        {/* Left Column - Event Details */}
        <DetailsSection>
          {event.coverImage?.url && (
            <CoverImage src={event.coverImage.url} alt={event.title} />
          )}

          <EventHeader>
            <EventType style={{ backgroundColor: getEventTypeColor(event.eventType) }}>
              {event.eventType.replace('-', ' ')}
            </EventType>
            <Title>{event.title}</Title>
            
            <MetaInfo>
              <MetaItem>
                <Calendar size={20} />
                <div>
                  <strong>{format(new Date(event.startAt), 'EEEE, MMMM dd, yyyy')}</strong>
                  <span>{format(new Date(event.startAt), 'h:mm a')} - {format(new Date(event.endAt), 'h:mm a')}</span>
                </div>
              </MetaItem>

              <MetaItem>
                <MapPin size={20} />
                <div>
                  <strong>{event.location.venue || 'Event Location'}</strong>
                  <span>{event.location.address}</span>
                </div>
              </MetaItem>

              {event.capacity > 0 && (
                <MetaItem>
                  <Users size={20} />
                  <div>
                    <strong>Capacity</strong>
                    <span>{event.currentRegistrations} / {event.capacity} registered</span>
                  </div>
                </MetaItem>
              )}
            </MetaInfo>
          </EventHeader>

          <Description>
            <h3>About This Event</h3>
            <p>{event.description}</p>
          </Description>

          {event.tags && event.tags.length > 0 && (
            <TagsSection>
              <h3>Tags</h3>
              <Tags>
                {event.tags.map((tag, index) => (
                  <TagBadge key={index}>
                    <Tag size={14} />
                    {tag}
                  </TagBadge>
                ))}
              </Tags>
            </TagsSection>
          )}

          {(event.contactEmail || event.contactPhone || event.externalLink) && (
            <ContactSection>
              <h3>Contact Information</h3>
              {event.contactEmail && (
                <ContactItem>
                  <Mail size={18} />
                  <a href={`mailto:${event.contactEmail}`}>{event.contactEmail}</a>
                </ContactItem>
              )}
              {event.contactPhone && (
                <ContactItem>
                  <Phone size={18} />
                  <a href={`tel:${event.contactPhone}`}>{event.contactPhone}</a>
                </ContactItem>
              )}
              {event.externalLink && (
                <ContactItem>
                  <LinkIcon size={18} />
                  <a href={event.externalLink} target="_blank" rel="noopener noreferrer">
                    Event Website
                  </a>
                </ContactItem>
              )}
            </ContactSection>
          )}

          {event.organizer && (
            <OrganizerSection>
              <h3>Organized By</h3>
              <OrganizerCard>
                {event.organizer.avatar && (
                  <OrganizerAvatar src={event.organizer.avatar} alt={event.organizer.name} />
                )}
                <div>
                  <OrganizerName>{event.organizer.name}</OrganizerName>
                  {event.organizer.organizerProfile?.organizationName && (
                    <OrganizationName>{event.organizer.organizerProfile.organizationName}</OrganizationName>
                  )}
                </div>
              </OrganizerCard>
            </OrganizerSection>
          )}
        </DetailsSection>

        {/* Right Column - Map & Actions */}
        <SideSection>
          <ActionCard>
            {!isOrganizer && !isPast && (
              <>
                {event.registrationRequired ? (
                  <RegisterButton
                    onClick={handleRegister}
                    disabled={isFull}
                  >
                    {isFull ? 'Event Full' : 'Register for Event'}
                  </RegisterButton>
                ) : (
                  <InfoBox>
                    <Calendar size={20} />
                    <div>
                      <strong>Free Event</strong>
                      <span>No registration required</span>
                    </div>
                  </InfoBox>
                )}
              </>
            )}

            {isPast && (
              <InfoBox style={{ background: '#fee2e2', color: '#991b1b' }}>
                <Clock size={20} />
                <div>
                  <strong>Event Ended</strong>
                  <span>This event has already taken place</span>
                </div>
              </InfoBox>
            )}

            {isOrganizer && (
              <InfoBox style={{ background: '#dbeafe', color: '#1e40af' }}>
                <User size={20} />
                <div>
                  <strong>You're the Organizer</strong>
                  <span>Manage this event from your dashboard</span>
                </div>
              </InfoBox>
            )}
          </ActionCard>

          <MapCard>
            <h3>Event Location</h3>
            <MapContainer
              center={[event.location.coordinates[1], event.location.coordinates[0]]}
              zoom={15}
              style={{ height: '300px', width: '100%', borderRadius: '0.5rem' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[event.location.coordinates[1], event.location.coordinates[0]]}>
                <Popup>
                  <strong>{event.title}</strong>
                  <br />
                  {event.location.address}
                </Popup>
              </Marker>
            </MapContainer>
            <MapAddress>
              <MapPin size={16} />
              {event.location.address}
            </MapAddress>
            <DirectionsButton
              href={`https://www.google.com/maps/dir/?api=1&destination=${event.location.coordinates[1]},${event.location.coordinates[0]}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get Directions
            </DirectionsButton>
          </MapCard>

          <StatsCard>
            <StatItem>
              <StatLabel>Views</StatLabel>
              <StatValue>{event.views || 0}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Registered</StatLabel>
              <StatValue>{event.currentRegistrations || 0}</StatValue>
            </StatItem>
          </StatsCard>
        </SideSection>
      </ContentGrid>

      {/* Event Registration Modal */}
      <EventRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        event={event}
        onSuccess={handleRegistrationSuccess}
      />
    </PageWrapper>
  );
};

const PageWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  color: #64748b;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 1.5rem;
  transition: all 0.2s;

  &:hover {
    background: #f8fafc;
    color: #1e293b;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const DetailsSection = styled.div`
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const CoverImage = styled.img`
  width: 100%;
  height: 400px;
  object-fit: cover;

  @media (max-width: 768px) {
    height: 250px;
  }
`;

const EventHeader = styled.div`
  padding: 2rem;
`;

const EventType = styled.span`
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 1rem;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: capitalize;
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const MetaInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: start;
  gap: 1rem;

  svg {
    color: #4F46E5;
    flex-shrink: 0;
    margin-top: 0.25rem;
  }

  div {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    strong {
      font-weight: 600;
      color: #1e293b;
    }

    span {
      color: #64748b;
      font-size: 0.875rem;
    }
  }
`;

const Description = styled.div`
  padding: 2rem;
  border-top: 1px solid #e2e8f0;

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 1rem;
  }

  p {
    color: #475569;
    line-height: 1.7;
    white-space: pre-wrap;
  }
`;

const TagsSection = styled.div`
  padding: 2rem;
  border-top: 1px solid #e2e8f0;

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 1rem;
  }
`;

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const TagBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #f1f5f9;
  color: #475569;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
`;

const ContactSection = styled.div`
  padding: 2rem;
  border-top: 1px solid #e2e8f0;

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 1rem;
  }
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;

  svg {
    color: #4F46E5;
    flex-shrink: 0;
  }

  a {
    color: #4F46E5;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const OrganizerSection = styled.div`
  padding: 2rem;
  border-top: 1px solid #e2e8f0;

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 1rem;
  }
`;

const OrganizerCard = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.75rem;
`;

const OrganizerAvatar = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
`;

const OrganizerName = styled.div`
  font-weight: 600;
  color: #1e293b;
  font-size: 1.125rem;
`;

const OrganizationName = styled.div`
  color: #64748b;
  font-size: 0.875rem;
`;

const SideSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ActionCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const RegisterButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #4F46E5;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
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

const InfoBox = styled.div`
  display: flex;
  align-items: start;
  gap: 1rem;
  padding: 1rem;
  background: #f0fdf4;
  color: #166534;
  border-radius: 0.5rem;

  svg {
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  div {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    strong {
      font-weight: 600;
    }

    span {
      font-size: 0.875rem;
      opacity: 0.9;
    }
  }
`;

const MapCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 1rem;
  }
`;

const MapAddress = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  color: #475569;
  font-size: 0.875rem;

  svg {
    color: #4F46E5;
    flex-shrink: 0;
  }
`;

const DirectionsButton = styled.a`
  display: block;
  text-align: center;
  padding: 0.75rem;
  margin-top: 1rem;
  background: #4F46E5;
  color: white;
  border-radius: 0.5rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: #4338ca;
  }
`;

const StatsCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1rem;

  .spinner {
    color: #4F46E5;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  p {
    color: #64748b;
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 2rem;

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.5rem;
  }

  p {
    color: #64748b;
    margin-bottom: 1.5rem;
  }
`;

export default EventDetails;
