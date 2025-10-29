import React, { useState, useEffect, useContext } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import styled from 'styled-components';
import { borrowAPI } from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Calendar, Clock, User, Book, AlertTriangle, CheckCircle } from 'lucide-react';
import BookDetailsModal from './BookDetailsModal';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const StyledCalendarWrapper = styled.div`
  .rbc-calendar {
    height: 600px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    padding: 20px;
    color: #111827;
  }

  .rbc-header {
    background: #f8fafc;
    color: #374151;
    font-weight: 600;
    padding: 12px 8px;
    border-bottom: 2px solid #e5e7eb;
    border-radius: 8px 8px 0 0;
  }

  .rbc-today {
    background-color: rgba(59, 130, 246, 0.1);
  }

  .rbc-off-range-bg {
    background: #f9fafb;
  }

  .rbc-date-cell {
    color: #6b7280;
  }

  .rbc-date-cell.rbc-now {
    color: #3b82f6;
    font-weight: 600;
  }

  .rbc-month-view {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .rbc-day-bg {
    background: white;
    border-right: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
  }

  .rbc-day-bg:hover {
    background: #f9fafb;
  }

  .rbc-event {
    border-radius: 6px;
    border: none;
    padding: 4px 8px;
    font-size: 12px;
    font-weight: 500;
  }

  .rbc-event.borrowed {
    background-color: #3b82f6;
    color: white;
  }

  .rbc-event.approved {
    background-color: #10b981;
    color: white;
  }

  .rbc-event.overdue {
    background-color: #ef4444;
    color: white;
    animation: pulse 2s infinite;
  }

  .rbc-event.due-soon {
    background-color: #f59e0b;
    color: white;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .rbc-toolbar {
    margin-bottom: 20px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .rbc-toolbar-label {
    color: #111827;
    font-weight: 600;
    font-size: 1.1rem;
  }

  .rbc-btn-group button {
    background: white;
    border: 1px solid #d1d5db;
    color: #374151;
    padding: 8px 16px;
    border-radius: 6px;
    margin-right: 4px;
    font-weight: 500;
    transition: all 0.2s;
  }

  .rbc-btn-group button:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  .rbc-btn-group button.rbc-active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }
`;



const CalendarLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  }

  .legend-color {
    width: 16px;
    height: 16px;
    border-radius: 4px;
  }

  .borrowed { background-color: #3b82f6; }
  .approved { background-color: #10b981; }
  .overdue { background-color: #ef4444; }
  .due-soon { background-color: #f59e0b; }
`;

const BookLendingCalendar = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const { user: currentUser, loading: authLoading } = useContext(AuthContext);

    useEffect(() => {
        if (!authLoading) {
            if (currentUser?._id) {
                fetchBorrowRequests();
            } else {
                setLoading(false);
            }
        }
    }, [currentUser, authLoading]);

    const fetchBorrowRequests = async () => {
        try {
            setLoading(true);

            if (!currentUser?._id) {
                setLoading(false);
                return;
            }

            const response = await borrowAPI.getAllBorrowRequests();
            const data = response.data || response;

            if (!data || !Array.isArray(data)) {
                setEvents([]);
                setLoading(false);
                return;
            }

            if (data.length === 0) {
                // Try to fetch user's own requests and received requests separately
                try {
                    const [myRequests, receivedRequests] = await Promise.all([
                        borrowAPI.getMyRequests(),
                        borrowAPI.getReceivedRequests()
                    ]);

                    const allRequests = [
                        ...(myRequests.data?.requests || myRequests.data || []),
                        ...(receivedRequests.data?.requests || receivedRequests.data || [])
                    ];

                    if (allRequests.length > 0) {
                        // Process the combined data
                        const calendarEvents = allRequests
                            .filter(request => ['approved', 'borrowed'].includes(request.status))
                            .map(request => {
                                const now = new Date();
                                const dueDate = new Date(request.dueDate || Date.now() + 14 * 24 * 60 * 60 * 1000);
                                const daysDiff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

                                let eventClass = request.status;
                                if (request.status === 'borrowed') {
                                    if (daysDiff < 0) {
                                        eventClass = 'overdue';
                                    } else if (daysDiff <= 3) {
                                        eventClass = 'due-soon';
                                    }
                                }

                                const isLender = request.owner?._id === currentUser._id;
                                const otherUser = isLender ? request.borrower : request.owner;

                                return {
                                    id: request._id,
                                    title: `${request.book?.title || 'Unknown Book'} - ${isLender ? 'Lent to' : 'Borrowed from'} ${otherUser?.name || 'Unknown User'}`,
                                    start: new Date(request.createdAt),
                                    end: dueDate,
                                    allDay: false,
                                    resource: {
                                        ...request,
                                        isLender,
                                        otherUser,
                                        daysDiff,
                                        eventClass
                                    }
                                };
                            });

                        setEvents(calendarEvents);
                        setLoading(false);
                        return;
                    }
                } catch (fallbackError) {
                    // Fallback failed, continue with empty events
                }

                setEvents([]);
                setLoading(false);
                return;
            }

            const calendarEvents = data.map(request => {
                const now = new Date();
                const dueDate = new Date(request.dueDate);
                const daysDiff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

                let eventClass = request.status;
                if (request.status === 'borrowed') {
                    if (daysDiff < 0) {
                        eventClass = 'overdue';
                    } else if (daysDiff <= 3) {
                        eventClass = 'due-soon';
                    }
                }

                const isLender = request.owner?._id === currentUser._id;
                const otherUser = isLender ? request.borrower : request.owner;

                // Determine the correct start date based on status
                let startDate;
                if (request.status === 'borrowed' && request.metadata?.handoverDate) {
                    // Use handover date when book was actually borrowed
                    startDate = new Date(request.metadata.handoverDate);
                } else if (request.status === 'approved') {
                    // Use approval date for approved requests
                    startDate = new Date(request.updatedAt || request.createdAt);
                } else {
                    // Use creation date for other statuses
                    startDate = new Date(request.createdAt);
                }

                // Calculate lending duration for display
                const lendingDuration = request.book?.lendingDuration || 14;
                const endDate = request.dueDate ? new Date(request.dueDate) : new Date(startDate.getTime() + lendingDuration * 24 * 60 * 60 * 1000);

                // Create a more informative title
                let eventTitle;
                if (request.status === 'borrowed') {
                    eventTitle = `${request.book.title} (${lendingDuration}d) - ${isLender ? 'Lent to' : 'Borrowed from'} ${otherUser.name}`;
                } else {
                    eventTitle = `${request.book.title} (${lendingDuration}d) - ${request.status} - ${isLender ? 'To' : 'From'} ${otherUser.name}`;
                }

                return {
                    id: request._id,
                    title: eventTitle,
                    start: startDate,
                    end: endDate,
                    allDay: false,
                    resource: {
                        ...request,
                        isLender,
                        otherUser,
                        daysDiff,
                        eventClass,
                        lendingDuration,
                        borrowStartDate: startDate,
                        borrowEndDate: endDate
                    }
                };
            });

            setEvents(calendarEvents);
        } catch (error) {
            console.error('Failed to fetch borrow requests:', error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectEvent = (event, e) => {
        setSelectedEvent(event);
    };

    const handleCloseModal = () => {
        setSelectedEvent(null);
    };

    const eventStyleGetter = (event) => {
        const { eventClass } = event.resource;

        const styles = {
            borrowed: { backgroundColor: '#3b82f6', color: 'white' },
            approved: { backgroundColor: '#10b981', color: 'white' },
            overdue: { backgroundColor: '#ef4444', color: 'white' },
            'due-soon': { backgroundColor: '#f59e0b', color: 'white' }
        };

        return {
            style: styles[eventClass] || styles.borrowed
        };
    };

    const getStatusIcon = (status, daysDiff) => {
        if (status === 'borrowed' && daysDiff < 0) {
            return <AlertTriangle size={16} className="text-red-600" />;
        }
        if (status === 'borrowed' && daysDiff <= 3) {
            return <Clock size={16} className="text-yellow-600" />;
        }
        if (status === 'approved') {
            return <CheckCircle size={16} className="text-green-600" />;
        }
        return <Book size={16} className="text-blue-600" />;
    };

    const getStatusText = (status, daysDiff) => {
        if (status === 'borrowed' && daysDiff < 0) {
            return 'Overdue';
        }
        if (status === 'borrowed' && daysDiff <= 3) {
            return 'Due Soon';
        }
        if (status === 'approved') {
            return 'Approved';
        }
        return 'Borrowed';
    };

    const getStatusClass = (status, daysDiff) => {
        if (status === 'borrowed' && daysDiff < 0) {
            return 'status-overdue';
        }
        if (status === 'borrowed' && daysDiff <= 3) {
            return 'status-due-soon';
        }
        if (status === 'approved') {
            return 'status-approved';
        }
        return 'status-borrowed';
    };

    if (loading || authLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading calendar...</span>
            </div>
        );
    }

    return (
        <StyledCalendarWrapper>
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Book Lending Calendar</h2>
                </div>

                <CalendarLegend>
                    <div className="legend-item">
                        <div className="legend-color borrowed"></div>
                        <span>Borrowed Books</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color approved"></div>
                        <span>Approved Requests</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color due-soon"></div>
                        <span>Due Soon (≤3 days)</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color overdue"></div>
                        <span>Overdue</span>
                    </div>
                </CalendarLegend>
            </div>

            {events.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                        <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No Book Activities</h3>
                        <p>You don't have any active borrowing or lending activities yet.</p>
                        <p className="text-sm mt-2">Start by browsing books in the community or adding your own books to lend!</p>
                        <p className="text-xs mt-2 text-gray-400">💡 Tip: When you lend books, you can set custom lending durations (e.g., 3 days, 7 days, 14 days)</p>
                    </div>
                </div>
            ) : (
                <BigCalendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={eventStyleGetter}
                    views={['month', 'week', 'day']}
                    defaultView="month"
                    popup
                    tooltipAccessor={null}
                />
            )}

            <BookDetailsModal
                event={selectedEvent}
                onClose={handleCloseModal}
                currentUser={currentUser}
            />
        </StyledCalendarWrapper>
    );
};

export default BookLendingCalendar;