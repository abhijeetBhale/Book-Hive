import React, { useState, useEffect } from 'react';
import { eventsAPI } from '../../utils/api';
import { Calendar, MapPin, Users, Eye, Loader, Search, Filter, Clock, Trash2, XCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import VerifiedBadge from '../ui/VerifiedBadge';

const EventsTab = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        eventType: '',
        status: 'all'
    });
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, [filters]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            // Use admin endpoint to get all events including past ones
            const response = await eventsAPI.getAllEventsAdmin(filters);
            setEvents(response.data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
            toast.error('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const viewDetails = (event) => {
        setSelectedEvent(event);
        setShowDetailsModal(true);
    };

    const handleCancelEvent = async () => {
        if (!selectedEvent || !cancelReason.trim()) {
            toast.error('Please provide a cancellation reason');
            return;
        }

        try {
            setActionLoading(true);
            await eventsAPI.cancelEvent(selectedEvent._id, cancelReason);
            toast.success('Event cancelled successfully');
            setShowCancelModal(false);
            setCancelReason('');
            setSelectedEvent(null);
            fetchEvents(); // Refresh the list
        } catch (error) {
            console.error('Error cancelling event:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel event');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteEvent = async () => {
        if (!selectedEvent) return;

        try {
            setActionLoading(true);
            await eventsAPI.deleteEvent(selectedEvent._id);
            toast.success('Event deleted successfully');
            setShowDeleteModal(false);
            setSelectedEvent(null);
            fetchEvents(); // Refresh the list
        } catch (error) {
            console.error('Error deleting event:', error);
            toast.error(error.response?.data?.message || 'Failed to delete event');
        } finally {
            setActionLoading(false);
        }
    };

    const openCancelModal = (event) => {
        setSelectedEvent(event);
        setShowCancelModal(true);
    };

    const openDeleteModal = (event) => {
        setSelectedEvent(event);
        setShowDeleteModal(true);
    };

    const getEventTypeColor = (type) => {
        const colors = {
            'workshop': 'bg-purple-100 text-purple-800',
            'book-reading': 'bg-blue-100 text-blue-800',
            'author-meetup': 'bg-pink-100 text-pink-800',
            'book-club': 'bg-green-100 text-green-800',
            'literary-festival': 'bg-orange-100 text-orange-800',
            'book-launch': 'bg-red-100 text-red-800',
            'discussion': 'bg-indigo-100 text-indigo-800',
            'other': 'bg-gray-100 text-gray-800'
        };
        return colors[type] || colors.other;
    };

    const getStatusColor = (status) => {
        const colors = {
            'published': 'bg-green-100 text-green-800',
            'draft': 'bg-gray-100 text-gray-800',
            'cancelled': 'bg-red-100 text-red-800',
            'completed': 'bg-blue-100 text-blue-800'
        };
        return colors[status] || colors.draft;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search events by title or description..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <select
                        value={filters.eventType}
                        onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            {/* Events List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Events ({events.length})
                    </h3>
                </div>

                {events.length === 0 ? (
                    <div className="p-12 text-center">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">No events found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Event
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date & Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Location
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Registrations
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Organizer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {events.map((event) => (
                                    <tr key={event._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                {event.coverImage?.url && (
                                                    <img
                                                        src={event.coverImage.url}
                                                        alt={event.title}
                                                        className="w-12 h-12 rounded object-cover mr-3"
                                                    />
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {event.title}
                                                    </div>
                                                    <div className="text-sm text-gray-500 line-clamp-1">
                                                        {event.description?.substring(0, 50)}...
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getEventTypeColor(event.eventType)}`}>
                                                {event.eventType.replace('-', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {format(new Date(event.startAt), 'MMM dd, yyyy')}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {format(new Date(event.startAt), 'h:mm a')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate">
                                                {event.location?.address || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {event.currentRegistrations || 0}
                                            {event.capacity > 0 && ` / ${event.capacity}`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {event.organizer?.name || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(event.status)}`}>
                                                {event.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => viewDetails(event)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {event.status !== 'cancelled' && (
                                                    <button
                                                        onClick={() => openCancelModal(event)}
                                                        className="text-orange-600 hover:text-orange-900"
                                                        title="Cancel Event"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openDeleteModal(event)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete Event"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {showDetailsModal && selectedEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-900">{selectedEvent.title}</h3>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <Eye className="w-6 h-6" />
                                </button>
                            </div>

                            {selectedEvent.coverImage?.url && (
                                <img
                                    src={selectedEvent.coverImage.url}
                                    alt={selectedEvent.title}
                                    className="w-full h-64 object-cover rounded-lg mb-4"
                                />
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Description</label>
                                    <p className="text-gray-900 whitespace-pre-wrap">{selectedEvent.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Event Type</label>
                                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getEventTypeColor(selectedEvent.eventType)}`}>
                                            {selectedEvent.eventType.replace('-', ' ')}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Status</label>
                                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(selectedEvent.status)}`}>
                                            {selectedEvent.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Start Date & Time
                                        </label>
                                        <p className="text-gray-900">
                                            {format(new Date(selectedEvent.startAt), 'EEEE, MMMM dd, yyyy')}
                                            <br />
                                            {format(new Date(selectedEvent.startAt), 'h:mm a')}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            End Date & Time
                                        </label>
                                        <p className="text-gray-900">
                                            {format(new Date(selectedEvent.endAt), 'EEEE, MMMM dd, yyyy')}
                                            <br />
                                            {format(new Date(selectedEvent.endAt), 'h:mm a')}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        Location
                                    </label>
                                    <p className="text-gray-900">{selectedEvent.location?.address}</p>
                                    {selectedEvent.location?.venue && (
                                        <p className="text-sm text-gray-500">Venue: {selectedEvent.location.venue}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            Registrations
                                        </label>
                                        <p className="text-gray-900">
                                            {selectedEvent.currentRegistrations || 0}
                                            {selectedEvent.capacity > 0 && ` / ${selectedEvent.capacity}`}
                                            {selectedEvent.capacity === 0 && ' (Unlimited)'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Organizer</label>
                                        <p className="text-gray-900 flex items-center gap-2">
                                            {selectedEvent.organizer?.name}
                                            {selectedEvent.organizer?.isVerified && <VerifiedBadge size={16} />}
                                        </p>
                                        <p className="text-sm text-gray-500">{selectedEvent.organizer?.email}</p>
                                    </div>
                                </div>

                                {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Tags</label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {selectedEvent.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex px-2 py-1 text-xs rounded bg-gray-100 text-gray-700"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedEvent.externalLink && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">External Link</label>
                                        <a
                                            href={selectedEvent.externalLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline block"
                                        >
                                            {selectedEvent.externalLink}
                                        </a>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    {selectedEvent.contactEmail && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Contact Email</label>
                                            <p className="text-gray-900">{selectedEvent.contactEmail}</p>
                                        </div>
                                    )}
                                    {selectedEvent.contactPhone && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                                            <p className="text-gray-900">{selectedEvent.contactPhone}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                                    <div>
                                        <label className="font-medium">Views</label>
                                        <p>{selectedEvent.views || 0}</p>
                                    </div>
                                    <div>
                                        <label className="font-medium">Public</label>
                                        <p>{selectedEvent.isPublic ? 'Yes' : 'No'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Event Modal */}
            {showCancelModal && selectedEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Cancel Event</h3>
                                <p className="text-sm text-gray-500">This action cannot be undone</p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-700 mb-2">
                                Are you sure you want to cancel "<strong>{selectedEvent.title}</strong>"?
                            </p>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cancellation Reason *
                            </label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Please provide a reason for cancellation..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                rows="3"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancelReason('');
                                    setSelectedEvent(null);
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCancelEvent}
                                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                                disabled={actionLoading || !cancelReason.trim()}
                            >
                                {actionLoading ? 'Cancelling...' : 'Cancel Event'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Event Modal */}
            {showDeleteModal && selectedEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Delete Event</h3>
                                <p className="text-sm text-gray-500">This action cannot be undone</p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-700">
                                Are you sure you want to permanently delete "<strong>{selectedEvent.title}</strong>"?
                            </p>
                            <p className="text-sm text-red-600 mt-2">
                                This will also delete all registrations for this event.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedEvent(null);
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteEvent}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Deleting...' : 'Delete Event'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventsTab;
