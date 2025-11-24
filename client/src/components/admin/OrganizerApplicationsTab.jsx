import React, { useState, useEffect } from 'react';
import { organizerAPI } from '../../utils/api';
import { UserCheck, X, Check, Eye, Loader, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const OrganizerApplicationsTab = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all'
    });
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    useEffect(() => {
        fetchApplications();
    }, [filters]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const response = await organizerAPI.getApplications(filters);
            setApplications(response.data || []);
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast.error('Failed to load organizer applications');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (applicationId) => {
        if (!confirm('Are you sure you want to approve this organizer application?')) return;

        try {
            await organizerAPI.approveApplication(applicationId);
            toast.success('Application approved successfully!');
            fetchApplications();
        } catch (error) {
            console.error('Error approving application:', error);
            toast.error(error.response?.data?.message || 'Failed to approve application');
        }
    };

    const handleReject = async (applicationId) => {
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;

        try {
            await organizerAPI.rejectApplication(applicationId, reason);
            toast.success('Application rejected');
            fetchApplications();
        } catch (error) {
            console.error('Error rejecting application:', error);
            toast.error(error.response?.data?.message || 'Failed to reject application');
        }
    };

    const viewDetails = (application) => {
        setSelectedApplication(application);
        setShowDetailsModal(true);
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
                                placeholder="Search by organization name or email..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Applications</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Applications List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Organizer Applications ({applications.length})
                    </h3>
                </div>

                {applications.length === 0 ? (
                    <div className="p-12 text-center">
                        <UserCheck className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">No applications found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Organization
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Applied
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
                                {applications.map((app) => (
                                    <tr key={app._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {app.organizationName}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {app.user?.name || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                                {app.organizationType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{app.contactEmail}</div>
                                            <div className="text-sm text-gray-500">{app.contactPhone}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(app.createdAt), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs rounded-full ${app.status === 'approved'
                                                        ? 'bg-green-100 text-green-800'
                                                        : app.status === 'rejected'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}
                                            >
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => viewDetails(app)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {app.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(app._id)}
                                                            className="text-green-600 hover:text-green-900"
                                                            title="Approve"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(app._id)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Reject"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
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
            {showDetailsModal && selectedApplication && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-900">Application Details</h3>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Organization Name</label>
                                    <p className="text-gray-900">{selectedApplication.organizationName}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Organization Type</label>
                                    <p className="text-gray-900">{selectedApplication.organizationType}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Description</label>
                                    <p className="text-gray-900 whitespace-pre-wrap">{selectedApplication.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Contact Email</label>
                                        <p className="text-gray-900">{selectedApplication.contactEmail}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                                        <p className="text-gray-900">{selectedApplication.contactPhone}</p>
                                    </div>
                                </div>

                                {selectedApplication.website && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Website</label>
                                        <a
                                            href={selectedApplication.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            {selectedApplication.website}
                                        </a>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Applied By</label>
                                    <p className="text-gray-900">{selectedApplication.user?.name} ({selectedApplication.user?.email})</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    <span
                                        className={`inline-flex px-2 py-1 text-xs rounded-full ${selectedApplication.status === 'approved'
                                                ? 'bg-green-100 text-green-800'
                                                : selectedApplication.status === 'rejected'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}
                                    >
                                        {selectedApplication.status}
                                    </span>
                                </div>

                                {selectedApplication.status === 'rejected' && selectedApplication.rejectionReason && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Rejection Reason</label>
                                        <p className="text-red-600">{selectedApplication.rejectionReason}</p>
                                    </div>
                                )}
                            </div>

                            {selectedApplication.status === 'pending' && (
                                <div className="mt-6 flex gap-3">
                                    <button
                                        onClick={() => {
                                            handleApprove(selectedApplication._id);
                                            setShowDetailsModal(false);
                                        }}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                                    >
                                        <Check className="w-4 h-4" />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleReject(selectedApplication._id);
                                            setShowDetailsModal(false);
                                        }}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizerApplicationsTab;
