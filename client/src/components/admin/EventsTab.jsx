import React, { useState, useEffect } from 'react';
import { eventsAPI } from '../../utils/api';
import { Calendar, MapPin, Users, Eye, Loader, Search, Filter, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

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

    useEffect(() => {
        fetchEvents();
    }, [filters]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await eventsAPI.getPublicEvents(filters);
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
                                            <button
                                                onClick={() => viewDetails(event)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
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
                                        <p className="text-gray-900">{selectedEvent.organizer?.name}</p>
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
        </div>
    );
};

export default EventsTab;
