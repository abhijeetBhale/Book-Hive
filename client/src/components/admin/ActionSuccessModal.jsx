import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Ban, 
  Trash2, 
  X,
  User,
  Clock,
  MessageSquare
} from 'lucide-react';

const ActionSuccessModal = ({ 
  isOpen, 
  onClose, 
  action, 
  report, 
  actionData 
}) => {
  if (!isOpen) return null;

  const getSuccessConfig = () => {
    switch (action) {
      case 'warn':
        return {
          title: 'Warning Sent Successfully',
          icon: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
          color: 'yellow',
          message: 'The user has been notified about the warning.',
          details: [
            { label: 'Action Taken', value: 'Warning Issued' },
            { label: 'User Notified', value: 'Yes' },
            { label: 'Message', value: actionData?.message?.substring(0, 100) + '...' }
          ]
        };
      case 'ban':
        return {
          title: 'User Banned Successfully',
          icon: <Ban className="w-8 h-8 text-orange-500" />,
          color: 'orange',
          message: `The user has been banned for ${actionData?.duration} day${actionData?.duration !== 1 ? 's' : ''}.`,
          details: [
            { label: 'Action Taken', value: 'Temporary Ban' },
            { label: 'Duration', value: `${actionData?.duration} day${actionData?.duration !== 1 ? 's' : ''}` },
            { label: 'Reason', value: actionData?.reason },
            { label: 'User Notified', value: 'Yes' }
          ]
        };
      case 'delete':
        return {
          title: 'Account Deleted Successfully',
          icon: <Trash2 className="w-8 h-8 text-red-500" />,
          color: 'red',
          message: 'The user account has been permanently deactivated.',
          details: [
            { label: 'Action Taken', value: 'Account Deactivation' },
            { label: 'Status', value: 'Permanent' },
            { label: 'Reason', value: actionData?.reason },
            { label: 'User Notified', value: 'Yes' }
          ]
        };
      case 'dismiss':
        return {
          title: 'Report Dismissed',
          icon: <CheckCircle className="w-8 h-8 text-green-500" />,
          color: 'green',
          message: 'The report has been marked as resolved without action.',
          details: [
            { label: 'Action Taken', value: 'Report Dismissed' },
            { label: 'Status', value: 'Resolved' },
            { label: 'User Action', value: 'None' }
          ]
        };
      default:
        return {
          title: 'Action Completed',
          icon: <CheckCircle className="w-8 h-8 text-green-500" />,
          color: 'green',
          message: 'The action has been completed successfully.',
          details: []
        };
    }
  };

  const config = getSuccessConfig();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-gray-200 bg-${config.color}-50`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {config.icon}
              <h2 className="text-xl font-semibold text-gray-900">{config.title}</h2>
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
        <div className="px-6 py-6">
          {/* Success Message */}
          <div className="text-center mb-6">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-${config.color}-100 flex items-center justify-center`}>
              {config.icon}
            </div>
            <p className="text-gray-600 text-lg leading-relaxed">
              {config.message}
            </p>
          </div>

          {/* Report Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Report Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Reported User:</span>
                <span className="font-medium">{report?.reportedUser?.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Violation:</span>
                <span className="font-medium">
                  {report?.reason?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            </div>
          </div>

          {/* Action Details */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Action Summary</h3>
            <div className="space-y-2">
              {config.details.map((detail, index) => (
                <div key={index} className="flex justify-between items-start">
                  <span className="text-sm text-gray-600">{detail.label}:</span>
                  <span className="text-sm font-medium text-gray-900 text-right max-w-xs">
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          {action !== 'dismiss' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">What happens next?</p>
                  <p>
                    {action === 'warn' && 'The user will receive a notification about the warning and can continue using the platform.'}
                    {action === 'ban' && 'The user will be unable to log in until the ban expires. They will see a message explaining the suspension.'}
                    {action === 'delete' && 'The user account has been deactivated and they will no longer be able to access the platform.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className={`w-full px-4 py-3 text-white rounded-lg font-medium transition-colors ${
              config.color === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-600' :
              config.color === 'orange' ? 'bg-orange-500 hover:bg-orange-600' :
              config.color === 'red' ? 'bg-red-500 hover:bg-red-600' :
              'bg-green-500 hover:bg-green-600'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionSuccessModal;