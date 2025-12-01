import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  Ban, 
  Trash2, 
  CheckCircle, 
  MessageSquare,
  Calendar,
  User,
  Shield,
  Clock
} from 'lucide-react';
import VerifiedBadge from '../ui/VerifiedBadge';

const ReportActionModal = ({ 
  isOpen, 
  onClose, 
  action, 
  report, 
  onConfirm 
}) => {
  const [formData, setFormData] = useState({
    message: '',
    duration: '7',
    reason: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const getActionConfig = () => {
    switch (action) {
      case 'warn':
        return {
          title: 'Send Warning',
          icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
          color: 'yellow',
          description: 'Send a warning message to the user about their behavior',
          defaultMessage: 'You have received a warning for violating our community guidelines. Please review our terms of service and ensure your future interactions comply with our standards.'
        };
      case 'ban':
        return {
          title: 'Ban User',
          icon: <Ban className="w-6 h-6 text-orange-500" />,
          color: 'orange',
          description: 'Temporarily suspend the user\'s account',
          defaultReason: 'Violation of community guidelines'
        };
      case 'delete':
        return {
          title: 'Delete Account',
          icon: <Trash2 className="w-6 h-6 text-red-500" />,
          color: 'red',
          description: 'Permanently deactivate the user\'s account',
          defaultReason: 'Severe violation of community guidelines'
        };
      case 'dismiss':
        return {
          title: 'Dismiss Report',
          icon: <CheckCircle className="w-6 h-6 text-green-500" />,
          color: 'green',
          description: 'Mark this report as resolved without taking action'
        };
      default:
        return {
          title: 'Action',
          icon: <Shield className="w-6 h-6 text-gray-500" />,
          color: 'gray',
          description: 'Take action on this report'
        };
    }
  };

  const config = getActionConfig();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let actionData = {};
      
      switch (action) {
        case 'warn':
          actionData = { message: formData.message || config.defaultMessage };
          break;
        case 'ban':
          actionData = { 
            duration: parseInt(formData.duration), 
            reason: formData.reason || config.defaultReason 
          };
          break;
        case 'delete':
          actionData = { reason: formData.reason || config.defaultReason };
          break;
        case 'dismiss':
          actionData = {};
          break;
      }
      
      await onConfirm(actionData);
      onClose();
    } catch (error) {
      console.error('Error taking action:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
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
        <div className="px-6 py-4">
          {/* Report Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Report Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Reported User:</span>
                <span className="font-medium flex items-center gap-1.5">
                  {report?.reportedUser?.name}
                  {report?.reportedUser?.isVerified && <VerifiedBadge size={14} />}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Violation:</span>
                <span className="font-medium">
                  {report?.reason?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                <span className="text-gray-600">Description:</span>
                <span className="font-medium text-xs leading-relaxed">
                  {report?.description?.substring(0, 100)}
                  {report?.description?.length > 100 ? '...' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Action Description */}
          <div className="mb-6">
            <p className="text-gray-600 text-sm leading-relaxed">
              {config.description}
            </p>
          </div>

          {/* Action Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {action === 'warn' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warning Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder={config.defaultMessage}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This message will be sent to the user's notifications
                </p>
              </div>
            )}

            {action === 'ban' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Ban Duration
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="1">1 day</option>
                    <option value="3">3 days</option>
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ban Reason
                  </label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    placeholder={config.defaultReason}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            {action === 'delete' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deletion Reason
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  placeholder={config.defaultReason}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                    <div className="text-sm text-red-700">
                      <p className="font-medium">Warning: This action cannot be undone</p>
                      <p>The user's account will be permanently deactivated and they will lose access to all their data.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {action === 'dismiss' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div className="text-sm text-green-700">
                    <p className="font-medium">Dismiss Report</p>
                    <p>This report will be marked as resolved without taking any action against the reported user.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                  config.color === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-600' :
                  config.color === 'orange' ? 'bg-orange-500 hover:bg-orange-600' :
                  config.color === 'red' ? 'bg-red-500 hover:bg-red-600' :
                  config.color === 'green' ? 'bg-green-500 hover:bg-green-600' :
                  'bg-gray-500 hover:bg-gray-600'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    {config.icon}
                    <span>{config.title}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportActionModal;