import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { eventsAPI, organizerAPI } from '../utils/api';
import styled from 'styled-components';
import { Calendar, MapPin, Users, Search, Filter, Loader, Clock, Tag, Plus, Edit, Trash2, Eye, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import SEO from '../components/SEO';
import { BASE_URL } from '../utils/seo';
import CreateEventModal from '../components/events/CreateEventModal';

const Events = () => {
  const { user, fetchProfile } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'my-events'
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    eventType: '',
    startDate: '',
    endDate: '',
    radius: 50
  });
  const [showFilters, setShowFilters] = useState(false);

  // Refresh user profile on mount to get latest organizer status
  useEffect(() => {
    if (fetchProfile) {
      fetchProfile();
    }

    // Poll for profile updates every 30 seconds to catch organizer approval
    const pollInterval = setInterval(() => {
      if (fetchProfile) {
        fetchProfile();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(pollInterval);
  }, [fetchProfile]);

  useEffect(() => {
    if (activeTab === 'all') {
      fetchEvents();
    } else if (activeTab === 'my-events') {
      fetchMyEvents();
    }
  }, [filters, activeTab]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        ...filters
      };

      // Add user location if available
      if (user?.location?.coordinates) {
        params.lat = user.location.coordinates[1];
        params.lng = user.location.coordinates[0];
      }

      const response = await eventsAPI.getPublicEvents(params);
      setEvents(response.data || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      const [eventsRes, statsRes] = await Promise.all([
        organizerAPI.getOrganizerEvents({ status: filters.status || '' }),
        organizerAPI.getOrganizerStats()
      ]);
      setMyEvents(eventsRes.data || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch my events:', error);
      toast.error('Failed to load your events');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await organizerAPI.deleteEvent(eventId);
      toast.success('Event deleted successfully');
      fetchMyEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error(error.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (activeTab === 'all') {
      fetchEvents();
    } else {
      fetchMyEvents();
    }
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

  return (
    <>
      <SEO 
        title="Book Events Near You | BookHive"
        description="Discover book readings, author meetups, literary festivals, and book club events happening near you. Join the BookHive community at exciting literary events."
        keywords="book events, author meetups, book readings, literary festivals, book clubs, reading events, book community events"
        url={`${BASE_URL}/events`}
      />
      <StyledWrapper>
        <div className="header">
          <div className="header-content">
            <h1>Events</h1>
            <p>Discover and manage book-related events</p>
          </div>
          {!user?.isOrganizer && user?.role !== 'organizer' && (
            <button 
              className="btn-refresh" 
              onClick={() => {
                fetchProfile();
                toast.success('Profile refreshed!');
              }}
              title="Refresh your profile to check organizer status"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              Refresh Status
            </button>
          )}
        </div>

        {/* Welcome banner for new organizers */}
        {(user?.isOrganizer || user?.role === 'organizer') && user?.organizerProfile?.approvedAt && (
          new Date() - new Date(user.organizerProfile.approvedAt) < 7 * 24 * 60 * 60 * 1000 // Show for 7 days
        ) && (
          <div className="welcome-banner">
            <div className="welcome-content">
              <h3>🎉 Welcome to the Organizer Community!</h3>
              <p>Your application has been approved. You can now create and manage events to connect with book lovers in your community.</p>
            </div>
            <button className="btn-primary" onClick={() => setActiveTab('my-events')}>
              Get Started
            </button>
          </div>
        )}

        {/* Tabs for organizers */}
        {(user?.isOrganizer || user?.role === 'organizer') && (
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Events
            </button>
            <button
              className={`tab ${activeTab === 'my-events' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-events')}
            >
              My Events
            </button>
          </div>
        )}

      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button type="submit" className="btn-search">Search</button>
          <button 
            type="button" 
            className="btn-filter"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
          </button>
        </form>

        {showFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <label>Event Type</label>
              <select
                value={filters.eventType}
                onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="workshop">Workshop</option>
                <option value="book-reading">Book Reading</option>
                <option value="author-meetup">Author Meetup</option>
                <option value="book-club">Book Club</option>
                <option value="literary-festival">Literary Festival</option>
                <option value="book-launch">Book Launch</option>
                <option value="discussion">Discussion</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div className="filter-group">
              <label>End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>

            {user?.location?.coordinates && (
              <div className="filter-group">
                <label>Distance: {filters.radius} km</label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={filters.radius}
                  onChange={(e) => setFilters({ ...filters, radius: e.target.value })}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {activeTab === 'all' ? (
        // All Events Tab
        loading ? (
          <div className="loading-container">
            <Loader className="spinner" size={48} />
            <p>Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <Calendar size={64} />
            <h3>No Events Found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
            <Link to={`/events/${event._id}`} key={event._id} className="event-card">
              {event.coverImage?.url && (
                <div className="event-image">
                  <img src={event.coverImage.url} alt={event.title} />
                </div>
              )}
              <div className="event-content">
                <div className="event-type" style={{ backgroundColor: getEventTypeColor(event.eventType) }}>
                  {event.eventType.replace('-', ' ')}
                </div>
                <h3 className="event-title">{event.title}</h3>
                <p className="event-description">
                  {event.description.substring(0, 120)}
                  {event.description.length > 120 && '...'}
                </p>
                <div className="event-meta">
                  <div className="meta-item">
                    <Calendar size={16} />
                    <span>{format(new Date(event.startAt), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="meta-item">
                    <Clock size={16} />
                    <span>{format(new Date(event.startAt), 'h:mm a')}</span>
                  </div>
                  <div className="meta-item">
                    <MapPin size={16} />
                    <span>{event.location.address}</span>
                  </div>
                  {event.capacity > 0 && (
                    <div className="meta-item">
                      <Users size={16} />
                      <span>{event.currentRegistrations}/{event.capacity}</span>
                    </div>
                  )}
                </div>
                {event.tags && event.tags.length > 0 && (
                  <div className="event-tags">
                    {event.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="tag">
                        <Tag size={12} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
        )
      ) : (
        // My Events Tab (Organizer Dashboard)
        <div className="organizer-section">
          {stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <Calendar size={24} />
                <div>
                  <p className="stat-label">Total Events</p>
                  <p className="stat-value">{stats.totalEvents || 0}</p>
                </div>
              </div>
              <div className="stat-card">
                <Users size={24} />
                <div>
                  <p className="stat-label">Total Registrations</p>
                  <p className="stat-value">{stats.totalRegistrations || 0}</p>
                </div>
              </div>
              <div className="stat-card">
                <Eye size={24} />
                <div>
                  <p className="stat-label">Total Views</p>
                  <p className="stat-value">{stats.totalViews || 0}</p>
                </div>
              </div>
            </div>
          )}

          <div className="my-events-header">
            <h2>My Events</h2>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={18} />
              Create Event
            </button>
          </div>

          {loading ? (
            <div className="loading-container">
              <Loader className="spinner" size={48} />
              <p>Loading your events...</p>
            </div>
          ) : myEvents.length === 0 ? (
            <div className="empty-state">
              <Calendar size={64} />
              <h3>No Events Yet</h3>
              <p>Create your first event to get started</p>
              <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                <Plus size={18} />
                Create Event
              </button>
            </div>
          ) : (
            <div className="my-events-list">
              {myEvents.map((event) => (
                <div key={event._id} className="my-event-card">
                  {event.coverImage?.url && (
                    <img src={event.coverImage.url} alt={event.title} className="event-thumbnail" />
                  )}
                  <div className="event-info">
                    <div className="event-header">
                      <h3>{event.title}</h3>
                      <span className={`status-badge ${event.status}`}>{event.status}</span>
                    </div>
                    <p className="event-date">
                      <Calendar size={16} />
                      {format(new Date(event.startAt), 'MMM dd, yyyy • h:mm a')}
                    </p>
                    <p className="event-location">
                      <MapPin size={16} />
                      {event.location?.address}
                    </p>
                    <p className="event-registrations">
                      <Users size={16} />
                      {event.currentRegistrations || 0} registrations
                      {event.capacity > 0 && ` / ${event.capacity}`}
                    </p>
                  </div>
                  <div className="event-actions">
                    <button className="action-btn" title="View">
                      <Eye size={18} />
                    </button>
                    <button className="action-btn" title="Edit" onClick={() => toast('Edit form coming soon!', { icon: 'ℹ️' })}>
                      <Edit size={18} />
                    </button>
                    <button className="action-btn delete" title="Delete" onClick={() => handleDeleteEvent(event._id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          if (activeTab === 'my-events') {
            fetchMyEvents();
          }
        }}
      />
      </StyledWrapper>
    </>
  );
};

const StyledWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;

  .welcome-banner {
    background: linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%);
    color: white;
    padding: 1.5rem;
    border-radius: 1rem;
    margin-bottom: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);

    .welcome-content {
      flex: 1;

      h3 {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }

      p {
        font-size: 1rem;
        opacity: 0.95;
        margin: 0;
      }
    }

    .btn-primary {
      background: white;
      color: #4F46E5;
      white-space: nowrap;

      &:hover {
        background: #f8fafc;
        transform: translateY(-2px);
      }
    }

    @media (max-width: 768px) {
      flex-direction: column;
      gap: 1rem;
      text-align: center;

      .btn-primary {
        width: 100%;
      }
    }
  }

  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    border-bottom: 2px solid #e2e8f0;

    .tab {
      padding: 0.75rem 1.5rem;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      color: #64748b;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: -2px;

      &:hover {
        color: #4F46E5;
      }

      &.active {
        color: #4F46E5;
        border-bottom-color: #4F46E5;
      }
    }
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    .header-content {
      h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 0.5rem;
      }

      p {
        color: #64748b;
        font-size: 1rem;
      }
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #4F46E5;
      color: white;
      border-radius: 0.5rem;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.2s;

      &:hover {
        background: #4338ca;
        transform: translateY(-2px);
      }
    }

    .btn-refresh {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: white;
      color: #4F46E5;
      border: 2px solid #4F46E5;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #4F46E5;
        color: white;
        transform: translateY(-2px);
      }

      svg {
        animation: none;
      }

      &:active svg {
        animation: spin 0.5s linear;
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  }

  .search-section {
    background: white;
    padding: 1.5rem;
    border-radius: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;

    .search-form {
      display: flex;
      gap: 1rem;

      .search-input-wrapper {
        flex: 1;
        position: relative;

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 3rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 1rem;

          &:focus {
            outline: none;
            border-color: #4F46E5;
          }
        }
      }

      .btn-search, .btn-filter {
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .btn-search {
        background: #4F46E5;
        color: white;
        border: none;

        &:hover {
          background: #4338ca;
        }
      }

      .btn-filter {
        background: white;
        color: #64748b;
        border: 1px solid #e2e8f0;

        &:hover {
          border-color: #4F46E5;
          color: #4F46E5;
        }
      }
    }

    .filters-panel {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e2e8f0;

      .filter-group {
        label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 0.5rem;
        }

        select, input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          font-size: 0.875rem;

          &:focus {
            outline: none;
            border-color: #4F46E5;
          }
        }

        input[type="range"] {
          padding: 0;
        }
      }
    }
  }

  .loading-container, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;

    .spinner {
      color: #4F46E5;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    h3 {
      font-size: 1.5rem;
      color: #1e293b;
      margin: 1rem 0 0.5rem;
    }

    p {
      color: #64748b;
      margin-bottom: 1.5rem;
    }

    svg:not(.spinner) {
      color: #cbd5e1;
    }
  }

  .events-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;

    .event-card {
      background: white;
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.3s;
      text-decoration: none;
      color: inherit;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
      }

      .event-image {
        width: 100%;
        height: 200px;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .event-content {
        padding: 1.5rem;

        .event-type {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 0.75rem;
        }

        .event-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .event-description {
          color: #64748b;
          font-size: 0.875rem;
          line-height: 1.5;
          margin-bottom: 1rem;
        }

        .event-meta {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #64748b;
            font-size: 0.875rem;

            svg {
              flex-shrink: 0;
            }

            span {
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }
        }

        .event-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;

          .tag {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.5rem;
            background: #f1f5f9;
            color: #475569;
            border-radius: 0.25rem;
            font-size: 0.75rem;
          }
        }
      }
    }
  }

  @media (max-width: 768px) {
    padding: 1rem;

    .header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .search-section .search-form {
      flex-direction: column;
    }

    .events-grid {
      grid-template-columns: 1fr;
    }
  }
  .organizer-section {
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;

      .stat-card {
        background: white;
        padding: 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 1rem;

        svg {
          color: #4F46E5;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
        }
      }
    }

    .my-events-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;

      h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
      }
    }

    .my-events-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .my-event-card {
        background: white;
        border-radius: 0.75rem;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        display: flex;
        gap: 1.5rem;
        align-items: center;
        transition: all 0.2s;

        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .event-thumbnail {
          width: 120px;
          height: 120px;
          object-fit: cover;
          border-radius: 0.5rem;
          flex-shrink: 0;
        }

        .event-info {
          flex: 1;

          .event-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 0.75rem;

            h3 {
              font-size: 1.25rem;
              font-weight: 600;
              color: #1e293b;
              margin: 0;
            }

            .status-badge {
              padding: 0.25rem 0.75rem;
              border-radius: 1rem;
              font-size: 0.75rem;
              font-weight: 600;
              text-transform: capitalize;

              &.published {
                background: #dcfce7;
                color: #166534;
              }

              &.draft {
                background: #f3f4f6;
                color: #4b5563;
              }

              &.cancelled {
                background: #fee2e2;
                color: #991b1b;
              }
            }
          }

          p {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: #64748b;
            margin: 0.5rem 0;

            svg {
              flex-shrink: 0;
            }
          }
        }

        .event-actions {
          display: flex;
          gap: 0.5rem;

          .action-btn {
            padding: 0.5rem;
            background: #f1f5f9;
            border: none;
            border-radius: 0.375rem;
            color: #64748b;
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
              background: #e2e8f0;
              color: #1e293b;
            }

            &.delete:hover {
              background: #fee2e2;
              color: #dc2626;
            }
          }
        }
      }
    }
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #4F46E5;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s;

    &:hover {
      background: #4338ca;
      transform: translateY(-2px);
    }
  }
`;

export default Events;
