import React from 'react';
import { 
  X, 
  User, 
  AlertTriangle, 
  MessageSquare, 
  Calendar, 
  Mail,
  Shield,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

const ReportDetailsModal = ({ isOpen, onClose, report }) => {
  if (!isOpen || !report) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getViolationType = (reason) => {
    const types = {
      harassment: 'Harassment or Bullying',
      inappropriate_behavior: 'Inappropriate Behavior',
      scam: 'Scam or Fraudulent Activity',
      fake_listing: 'Fake Book Listings',
      spam: 'Spam or Unwanted Messages',
      impersonation: 'Fake Profile or Impersonation',
      threats: 'Threats or Violence',
      other: 'Other Violation'
    };
    return types[reason] || reason?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Report Details</h2>
                <p className="text-sm text-gray-600">Report ID: {report._id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Status and Priority */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(report.status)}`}>
                {report.status?.charAt(0).toUpperCase() + report.status?.slice(1)}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Reported {new Date(report.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Violation Information */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-900 mb-2">Reported Violation</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-red-700">Type:</span>
                    <span className="text-sm font-medium text-red-900">
                      {getViolationType(report.reason)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <MessageSquare className="w-5 h-5 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {report.description || 'No description provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Users Involved */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reported User */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-orange-900 mb-2">Reported User</h3>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <img
                        src={report.reportedUser?.avatar || `https://ui-avatars.com/api/?name=${report.reportedUser?.name}&background=f97316&color=fff`}
                        alt={report.reportedUser?.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm font-medium text-orange-900">
                        {report.reportedUser?.name || 'Deleted User'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3 h-3 text-orange-600" />
                      <span className="text-xs text-orange-700">
                        {report.reportedUser?.email || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${report.reportedUser?.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-xs text-orange-700">
                        {report.reportedUser?.isActive ? 'Active Account' : 'Deactivated Account'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reporter */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900 mb-2">Reported By</h3>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <img
                        src={report.reportedBy?.avatar || `https://ui-avatars.com/api/?name=${report.reportedBy?.name}&background=3b82f6&color=fff`}
                        alt={report.reportedBy?.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm font-medium text-blue-900">
                        {report.reportedBy?.name || 'Deleted User'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3 h-3 text-blue-600" />
                      <span className="text-xs text-blue-700">
                        {report.reportedBy?.email || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Timeline
            </h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Report submitted:</span>
                <span className="font-medium text-gray-900">
                  {new Date(report.createdAt).toLocaleString()}
                </span>
              </div>
              {report.updatedAt !== report.createdAt && (
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Last updated:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(report.updatedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Admin Actions History */}
          {report.adminActions && report.adminActions.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-medium text-purple-900 mb-3 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Admin Actions
              </h3>
              <div className="space-y-2">
                {report.adminActions.map((action, index) => (
                  <div key={index} className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-purple-700">
                      {action.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="text-purple-600">
                      {new Date(action.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetailsModal;