/**
 * TerraFusionPro - Notification Center Component
 * Provides real-time notifications and alerts about important system events
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Toast notification types
const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Toast auto-dismiss timeout (in ms)
const AUTO_DISMISS_TIME = 5000;

// Global notification queue
let notificationQueue = [];
let notificationListeners = [];

// Export notification API for use throughout the app
export const notifications = {
  /**
   * Show a success notification
   * @param {string} message - The notification message
   * @param {Object} options - Optional configuration
   */
  success: (message, options = {}) => {
    addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      message,
      ...options
    });
  },
  
  /**
   * Show an error notification
   * @param {string} message - The notification message
   * @param {Object} options - Optional configuration
   */
  error: (message, options = {}) => {
    addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      message,
      ...options
    });
  },
  
  /**
   * Show a warning notification
   * @param {string} message - The notification message
   * @param {Object} options - Optional configuration
   */
  warning: (message, options = {}) => {
    addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      message,
      ...options
    });
  },
  
  /**
   * Show an info notification
   * @param {string} message - The notification message
   * @param {Object} options - Optional configuration
   */
  info: (message, options = {}) => {
    addNotification({
      type: NOTIFICATION_TYPES.INFO,
      message,
      ...options
    });
  }
};

/**
 * Add a notification to the queue
 * @param {Object} notification - The notification object
 */
function addNotification(notification) {
  const id = Date.now().toString();
  const newNotification = {
    id,
    ...notification,
    timestamp: new Date()
  };
  
  notificationQueue = [...notificationQueue, newNotification];
  notificationListeners.forEach(listener => listener(notificationQueue));
  
  // Auto-dismiss after timeout
  if (notification.autoDismiss !== false) {
    setTimeout(() => {
      removeNotification(id);
    }, notification.timeout || AUTO_DISMISS_TIME);
  }
}

/**
 * Remove a notification from the queue
 * @param {string} id - The notification ID to remove
 */
function removeNotification(id) {
  notificationQueue = notificationQueue.filter(notification => notification.id !== id);
  notificationListeners.forEach(listener => listener(notificationQueue));
}

/**
 * NotificationCenter component
 * Displays and manages toast notifications
 */
const NotificationCenter = () => {
  const [notifications, setNotifications] = useState(notificationQueue);
  
  // Register as a listener for notification updates
  useEffect(() => {
    const handleNotificationsChange = (newNotifications) => {
      setNotifications([...newNotifications]);
    };
    
    notificationListeners.push(handleNotificationsChange);
    
    return () => {
      notificationListeners = notificationListeners.filter(
        listener => listener !== handleNotificationsChange
      );
    };
  }, []);
  
  // Don't render anything if there are no notifications
  if (notifications.length === 0) {
    return null;
  }
  
  // Render notifications using a portal to ensure they appear above everything else
  return createPortal(
    <div className="notification-center">
      {notifications.map(notification => (
        <div 
          key={notification.id} 
          className={`notification-toast ${notification.type}`}
        >
          <div className="notification-icon">
            {notification.type === NOTIFICATION_TYPES.SUCCESS && '✅'}
            {notification.type === NOTIFICATION_TYPES.ERROR && '❌'}
            {notification.type === NOTIFICATION_TYPES.WARNING && '⚠️'}
            {notification.type === NOTIFICATION_TYPES.INFO && 'ℹ️'}
          </div>
          
          <div className="notification-content">
            {notification.title && (
              <div className="notification-title">{notification.title}</div>
            )}
            <div className="notification-message">{notification.message}</div>
          </div>
          
          <button 
            className="notification-close"
            onClick={() => removeNotification(notification.id)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
};

export default NotificationCenter;