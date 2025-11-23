import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { eventsAPI } from '../utils/api';
import styled from 'styled-components';
import { Calendar, MapPin, Users, Search, Filter, Loader, Clock, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Events = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    eventType: '',
    startDate: '',
    endDate: '',
    radius: 50
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [filters]);

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

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
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
    <StyledWrapper>
      <div className="header">
        <div className="header-content">
          <h1>Discover Events</h1>
          <p>Find book-related events happening near you</p>
        </div>
        {user?.role === 'organizer' && (
          <Link to="/organizer/dashboard" className="btn-primary">
            <Calendar size={18} />
            Manage My Events
          </Link>
        )}
      </div>

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

      {loading ? (
        <div className="loading-container">
          <Loader className="spinner" size={48} />
          <p>Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <Calendar size={64} />
          <h3>No Events Found</h3>
          <p>Try adjusting your search or filters</p>
          {user?.role === 'organizer' && (
            <Link to="/organizer/events/new" className="btn-primary">
              Create Your First Event
            </Link>
          )}
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
      )}
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;

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
`;

export default Events;
