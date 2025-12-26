import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { organizerAPI } from '../utils/api';
import styled from 'styled-components';
import { Calendar, Plus, Users, Eye, TrendingUp, Loader, Edit, Trash2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const OrganizerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsRes, statsRes] = await Promise.all([
        organizerAPI.getOrganizerEvents({ status: filter === 'all' ? '' : filter }),
        organizerAPI.getOrganizerStats()
      ]);
      setEvents(eventsRes.data || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await organizerAPI.deleteEvent(eventId);
      toast.success('Event deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error(error.response?.data?.message || 'Failed to delete event');
    }
  };

  if (loading) {
    return (
      <StyledWrapper>
        <div className="loading-container">
          <Loader className="spinner" size={48} />
          <p>Loading dashboard...</p>
        </div>
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper>
      <div className="header">
        <div>
          <h1>Organizer Dashboard</h1>
          <p>Manage your events and registrations</p>
        </div>
        <Link to="/organizer/events/new" className="btn-primary">
          <Plus size={20} />
          Create Event
        </Link>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dbeafe' }}>
              <Calendar size={24} style={{ color: '#3b82f6' }} />
            </div>
            <div className="stat-content">
              <h3>{stats.totalEvents}</h3>
              <p>Total Events</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dcfce7' }}>
              <TrendingUp size={24} style={{ color: '#10b981' }} />
            </div>
            <div className="stat-content">
              <h3>{stats.upcomingEvents}</h3>
              <p>Upcoming Events</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef3c7' }}>
              <Users size={24} style={{ color: '#f59e0b' }} />
            </div>
            <div className="stat-content">
              <h3>{stats.totalRegistrations}</h3>
              <p>Total Registrations</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f3e8ff' }}>
              <Eye size={24} style={{ color: '#8b5cf6' }} />
            </div>
            <div className="stat-content">
              <h3>{stats.totalViews}</h3>
              <p>Total Views</p>
            </div>
          </div>
        </div>
      )}

      <div className="events-section">
        <div className="section-header">
          <h2>Your Events</h2>
          <div className="filters">
            <button 
              className={filter === 'all' ? 'active' : ''} 
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={filter === 'published' ? 'active' : ''} 
              onClick={() => setFilter('published')}
            >
              Published
            </button>
            <button 
              className={filter === 'draft' ? 'active' : ''} 
              onClick={() => setFilter('draft')}
            >
              Drafts
            </button>
            <button 
              className={filter === 'completed' ? 'active' : ''} 
              onClick={() => setFilter('completed')}
            >
              Completed
            </button>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="empty-state">
            <Calendar size={64} />
            <h3>No Events Found</h3>
            <p>Create your first event to get started</p>
            <Link to="/organizer/events/new" className="btn-primary">
              <Plus size={18} />
              Create Event
            </Link>
          </div>
        ) : (
          <div className="events-list">
            {events.map((event) => (
              <div key={event._id} className="event-item">
                <div className="event-info">
                  <div className="event-status" data-status={event.status}>
                    {event.status}
                  </div>
                  <h3>{event.title}</h3>
                  <div className="event-meta">
                    <span>
                      <Calendar size={16} />
                      {format(new Date(event.startAt), 'MMM dd, yyyy')}
                    </span>
                    <span>
                      <Users size={16} />
                      {event.currentRegistrations} registered
                      {event.capacity > 0 && ` / ${event.capacity}`}
                    </span>
                    <span>
                      <Eye size={16} />
                      {event.views} views
                    </span>
                  </div>
                </div>
                <div className="event-actions">
                  <Link to={`/organizer/events/${event._id}`} className="btn-icon" title="View Details">
                    <Eye size={18} />
                  </Link>
                  <Link to={`/organizer/events/${event._id}/edit`} className="btn-icon" title="Edit">
                    <Edit size={18} />
                  </Link>
                  <Link to={`/organizer/events/${event._id}/registrants`} className="btn-icon" title="Registrants">
                    <Users size={18} />
                  </Link>
                  <button 
                    onClick={() => handleDelete(event._id)} 
                    className="btn-icon btn-danger"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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

    h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }

    p {
      color: #64748b;
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

    svg:not(.spinner) {
      color: #cbd5e1;
      margin-bottom: 1rem;
    }

    h3 {
      font-size: 1.5rem;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }

    p {
      color: #64748b;
      margin-bottom: 1.5rem;
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 1rem;

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .stat-content {
        h3 {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.25rem;
        }

        p {
          color: #64748b;
          font-size: 0.875rem;
        }
      }
    }
  }

  .events-section {
    background: white;
    padding: 1.5rem;
    border-radius: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;

      h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
      }

      .filters {
        display: flex;
        gap: 0.5rem;

        button {
          padding: 0.5rem 1rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          color: #64748b;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            border-color: #4F46E5;
            color: #4F46E5;
          }

          &.active {
            background: #4F46E5;
            border-color: #4F46E5;
            color: white;
          }
        }
      }
    }

    .events-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .event-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        background: #f8fafc;
        border-radius: 0.75rem;
        transition: all 0.2s;

        &:hover {
          background: #f1f5f9;
        }

        .event-info {
          flex: 1;

          .event-status {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 0.5rem;

            &[data-status="published"] {
              background: #dcfce7;
              color: #166534;
            }

            &[data-status="draft"] {
              background: #fef3c7;
              color: #92400e;
            }

            &[data-status="completed"] {
              background: #e0e7ff;
              color: #3730a3;
            }

            &[data-status="cancelled"] {
              background: #fee2e2;
              color: #991b1b;
            }
          }

          h3 {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 0.5rem;
          }

          .event-meta {
            display: flex;
            gap: 1.5rem;
            color: #64748b;
            font-size: 0.875rem;

            span {
              display: flex;
              align-items: center;
              gap: 0.375rem;
            }
          }
        }

        .event-actions {
          display: flex;
          gap: 0.5rem;

          .btn-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
            color: #64748b;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;

            &:hover {
              border-color: #4F46E5;
              color: #4F46E5;
            }

            &.btn-danger:hover {
              border-color: #ef4444;
              color: #ef4444;
            }
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

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .events-section {
      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .events-list .event-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;

        .event-actions {
          width: 100%;
          justify-content: flex-end;
        }
      }
    }
  }
`;

export default OrganizerDashboard;
