import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import { AuthContext } from '../context/AuthContext';
import BookLendingCalendar from '../components/calendar/BookLendingCalendar';
import { borrowAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Book, 
  User,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import VerifiedBadge from '../components/ui/VerifiedBadge';

const StyledWrapper = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 20px;

  .container {
    max-width: 1400px;
    margin: 0 auto;
  }

  .header {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-title h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    border-color: #d1d5db;
  }

  .stat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .stat-title {
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #111827;
  }

  .stat-change {
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .stat-change.positive {
    color: #10b981;
  }

  .stat-change.negative {
    color: #ef4444;
  }

  .stat-change.neutral {
    color: #6b7280;
  }

  .calendar-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .upcoming-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
    margin-top: 24px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .upcoming-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 16px;
  }

  .upcoming-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .upcoming-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
    transition: all 0.2s;
  }

  .upcoming-item:hover {
    border-color: #3b82f6;
    background: #f3f4f6;
  }

  .upcoming-item.overdue {
    border-color: #ef4444;
    background: #fef2f2;
  }

  .upcoming-item.due-soon {
    border-color: #f59e0b;
    background: #fffbeb;
  }

  .upcoming-icon {
    flex-shrink: 0;
  }

  .upcoming-content {
    flex: 1;
  }

  .upcoming-book {
    font-weight: 600;
    color: #111827;
    margin-bottom: 4px;
  }

  .upcoming-details {
    font-size: 14px;
    color: #6b7280;
  }

  .upcoming-date {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  }

  .empty-state {
    text-align: center;
    padding: 40px;
    color: #6b7280;
  }

  .empty-state-icon {
    margin: 0 auto 16px;
    opacity: 0.5;
  }

  @media (max-width: 768px) {
    padding: 12px;
    
    .header-content {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .stats-grid {
      grid-template-columns: 1fr;
    }
    
    .header-title h1 {
      font-size: 1.5rem;
    }
  }
`;

const Calendar = () => {
  const { user: currentUser, loading: authLoading } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalBorrowed: 0,
    totalLent: 0,
    overdue: 0,
    dueSoon: 0
  });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (currentUser?._id) {
        fetchCalendarData();
      } else {
        setLoading(false);
      }
    }
  }, [currentUser, authLoading]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      
      if (!currentUser?._id) {
        setLoading(false);
        return;
      }
      
      const response = await borrowAPI.getAllBorrowRequests();
      const data = response.data || response;
      
      if (!data || !Array.isArray(data)) {
        setStats({ totalBorrowed: 0, totalLent: 0, overdue: 0, dueSoon: 0 });
        setUpcomingEvents([]);
        setLoading(false);
        return;
      }

      if (data.length === 0) {
        setStats({ totalBorrowed: 0, totalLent: 0, overdue: 0, dueSoon: 0 });
        setUpcomingEvents([]);
        setLoading(false);
        return;
      }
      
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      let totalBorrowed = 0;
      let totalLent = 0;
      let overdue = 0;
      let dueSoon = 0;
      const upcoming = [];

      data.forEach(request => {
        const isLender = request.owner?._id === currentUser._id;
        const dueDate = new Date(request.dueDate);
        const daysDiff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

        if (isLender) {
          totalLent++;
        } else {
          totalBorrowed++;
        }

        if (request.status === 'borrowed') {
          if (daysDiff < 0) {
            overdue++;
            upcoming.push({
              ...request,
              isLender,
              daysDiff,
              type: 'overdue'
            });
          } else if (daysDiff <= 7) {
            dueSoon++;
            upcoming.push({
              ...request,
              isLender,
              daysDiff,
              type: 'due-soon'
            });
          }
        }
      });

      // Sort upcoming events by due date
      upcoming.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      setStats({
        totalBorrowed,
        totalLent,
        overdue,
        dueSoon
      });
      setUpcomingEvents(upcoming.slice(0, 10)); // Show only first 10
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
      
      // Set default empty stats
      setStats({ totalBorrowed: 0, totalLent: 0, overdue: 0, dueSoon: 0 });
      setUpcomingEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingIcon = (type) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle size={20} className="text-red-500" />;
      case 'due-soon':
        return <Clock size={20} className="text-yellow-500" />;
      default:
        return <CheckCircle size={20} className="text-green-500" />;
    }
  };

  const formatDueDate = (dueDate, daysDiff) => {
    const date = new Date(dueDate);
    const dateStr = date.toLocaleDateString();
    
    if (daysDiff < 0) {
      return `${dateStr} (${Math.abs(daysDiff)} days overdue)`;
    } else if (daysDiff === 0) {
      return `${dateStr} (Due today)`;
    } else if (daysDiff === 1) {
      return `${dateStr} (Due tomorrow)`;
    } else {
      return `${dateStr} (${daysDiff} days left)`;
    }
  };

  if (loading || authLoading) {
    return (
      <StyledWrapper>
        <div className="container">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading calendar...</span>
          </div>
        </div>
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper>
      <div className="container">
        <div className="header">
          <div className="header-content">
            <div className="header-title">
              <CalendarIcon className="w-8 h-8 text-blue-600" />
              <h1>Book Lending Calendar</h1>
            </div>
            <div className="text-gray-600">
              Track your borrowing and lending activities
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Books Borrowed</span>
              <Book className="w-5 h-5 text-blue-500" />
            </div>
            <div className="stat-value">{stats.totalBorrowed}</div>
            <div className="stat-change neutral">
              <span>Currently active</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Books Lent</span>
              <User className="w-5 h-5 text-green-500" />
            </div>
            <div className="stat-value">{stats.totalLent}</div>
            <div className="stat-change neutral">
              <span>Currently active</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Due Soon</span>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="stat-value">{stats.dueSoon}</div>
            <div className="stat-change neutral">
              <span>Within 7 days</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Overdue</span>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="stat-value">{stats.overdue}</div>
            <div className="stat-change negative">
              <span>Needs attention</span>
            </div>
          </div>
        </div>

        <div className="calendar-section">
          <BookLendingCalendar />
        </div>

        <div className="upcoming-section">
          <div className="upcoming-title">
            <Clock className="w-5 h-5 text-blue-600" />
            Upcoming Due Dates
          </div>
          
          {upcomingEvents.length > 0 ? (
            <div className="upcoming-list">
              {upcomingEvents.map((event) => (
                <div 
                  key={event._id} 
                  className={`upcoming-item ${event.type}`}
                >
                  <div className="upcoming-icon">
                    {getUpcomingIcon(event.type)}
                  </div>
                  <div className="upcoming-content">
                    <div className="upcoming-book">{event.book.title}</div>
                    <div className="upcoming-details">
                      {event.isLender 
                        ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            Lent to {event.borrower.name}
                            {event.borrower.isVerified && <VerifiedBadge size={12} />}
                          </span>
                        )
                        : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            Borrowed from {event.owner.name}
                            {event.owner.isVerified && <VerifiedBadge size={12} />}
                          </span>
                        )
                      }
                    </div>
                  </div>
                  <div className="upcoming-date">
                    {formatDueDate(event.dueDate, event.daysDiff)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <CheckCircle className="w-12 h-12 empty-state-icon" />
              <div>No upcoming due dates</div>
              <div className="text-sm">All your books are on track!</div>
            </div>
          )}
        </div>
      </div>
    </StyledWrapper>
  );
};

export default Calendar;