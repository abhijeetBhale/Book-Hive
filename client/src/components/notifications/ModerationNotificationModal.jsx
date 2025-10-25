import React from 'react';
import { 
  X, 
  AlertTriangle, 
  Ban, 
  Trash2, 
  Shield,
  Clock,
  Calendar,
  MessageSquare,
  Info
} from 'lucide-react';

const ModerationNotificationModal = ({ 
  isOpen, 
  onClose, 
  notifications 
}) => {
  if (!isOpen || !notifications || notifications.length === 0) {
    return null;
  }

  const getNotificationConfig = (notification) => {
    switch (notification.type) {
      case 'warning':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          titleColor: 'text-yellow-800',
          title: 'Community Guidelines Warning',
          priority: 'medium'
        };
      case 'ban':
        return {
          icon: <Ban className="w-8 h-8 text-orange-500" />,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          titleColor: 'text-orange-800',
          title: 'Account Temporarily Suspended',
          priority: 'high'
        };
      case 'account_deleted':
        return {
          icon: <Trash2 className="w-8 h-8 text-red-500" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          titleColor: 'text-red-800',
          title: 'Account Deactivated',
          priority: 'critical'
        };
      default:
        return {
          icon: <Info className="w-8 h-8 text-blue-500" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          titleColor: 'text-blue-800',
          title: 'Important Notice',
          priority: 'low'
        };
    }
  };

  // Sort notifications by priority and date
  const sortedNotifications = [...notifications].sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const configA = getNotificationConfig(a);
    const configB = getNotificationConfig(b);
    
    if (priorityOrder[configA.priority] !== priorityOrder[configB.priority]) {
      return priorityOrder[configB.priority] - priorityOrder[configA.priority];
    }
    
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const highestPriorityNotification = sortedNotifications[0];
  const config = getNotificationConfig(highestPriorityNotification);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`px-6 py-4 ${config.bgColor} ${config.borderColor} border-b`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {config.icon}
              <div>
                <h2 className={`text-xl font-semibold ${config.titleColor}`}>
                  {config.title}
                </h2>
                <p className="text-sm text-gray-600">
                  Important account notification
                </p>
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
        <div className="px-6 py-6">
          {/* Primary Notification */}
          <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 mb-4`}>
            <div className="flex items-start space-x-3">
              {config.icon}
              <div className="flex-1">
                <h3 className={`font-semibold ${config.titleColor} mb-2`}>
                  {highestPriorityNotification.title}
                </h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  {highestPriorityNotification.message}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(highestPriorityNotification.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(highestPriorityNotification.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Notifications */}
          {sortedNotifications.length > 1 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Additional Notifications ({sortedNotifications.length - 1})
              </h4>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {sortedNotifications.slice(1).map((notification, index) => {
                  const notifConfig = getNotificationConfig(notification);
                  return (
                    <div 
                      key={index} 
                      className={`${notifConfig.bgColor} ${notifConfig.borderColor} border rounded-lg p-3`}
                    >
                      <div className="flex items-start space-x-2">
                        <div className="w-6 h-6 flex items-center justify-center">
                          {React.cloneElement(notifConfig.icon, { className: 'w-4 h-4' })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className={`font-medium ${notifConfig.titleColor} text-sm`}>
                            {notification.title}
                          </h5>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Guidelines */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Shield className="w-5 h-5 text-gray-500 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">What you can do:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Review our community guidelines to understand the violation</li>
                  <li>• Contact support if you believe this action was taken in error</li>
                  <li>• Ensure future interactions comply with our terms of service</li>
                  {highestPriorityNotification.type === 'ban' && (
                    <li>• Your account access will be restored automatically when the suspension expires</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {sortedNotifications.length} notification{sortedNotifications.length !== 1 ? 's' : ''}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  // Mark notifications as read
                  // This would call an API to mark them as read
                  onClose();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Mark as Read
              </button>
              <button
                onClick={onClose}
                className={`px-6 py-2 text-white rounded-lg font-medium transition-colors text-sm ${
                  config.priority === 'critical' ? 'bg-red-600 hover:bg-red-700' :
                  config.priority === 'high' ? 'bg-orange-600 hover:bg-orange-700' :
                  config.priority === 'medium' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModerationNotificationModal;