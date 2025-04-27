/**
 * TerraFusionPro - Notification Center Component
 * Manages application-wide notifications and alerts
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

// Create notification context
const NotificationContext = createContext();

/**
 * Generate unique ID for notifications
 * @returns {string} Unique ID
 */
const generateId = () => {
  return `notification-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

/**
 * NotificationProvider Component
 * Provides notification functionality to the application
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  
  // Add notification
  const addNotification = (notification) => {
    const id = notification.id || generateId();
    const notificationWithDefaults = {
      id,
      type: 'info',
      title: '',
      message: '',
      duration: 5000,
      ...notification
    };
    
    setNotifications((prev) => [...prev, notificationWithDefaults]);
    
    // Auto-remove notification after duration
    if (notificationWithDefaults.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notificationWithDefaults.duration);
    }
    
    return id;
  };
  
  // Remove notification
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };
  
  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };
  
  // Helper methods for different notification types
  const info = (message, options = {}) => {
    return addNotification({ type: 'info', message, ...options });
  };
  
  const success = (message, options = {}) => {
    return addNotification({ type: 'success', message, ...options });
  };
  
  const warning = (message, options = {}) => {
    return addNotification({ type: 'warning', message, ...options });
  };
  
  const error = (message, options = {}) => {
    return addNotification({ type: 'error', message, ...options });
  };
  
  // Context value
  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    info,
    success,
    warning,
    error
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

/**
 * NotificationContainer Component
 * Renders notifications using a portal
 */
const NotificationContainer = () => {
  const { notifications, removeNotification } = useContext(NotificationContext);
  const [container, setContainer] = useState(null);
  
  useEffect(() => {
    // Create container element if it doesn't exist
    let element = document.getElementById('notification-container');
    
    if (!element) {
      element = document.createElement('div');
      element.id = 'notification-container';
      document.body.appendChild(element);
    }
    
    setContainer(element);
    
    // Cleanup function
    return () => {
      if (document.getElementById('notification-container')) {
        document.body.removeChild(element);
      }
    };
  }, []);
  
  if (!container) return null;
  
  return createPortal(
    <div className="notifications-wrapper">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>,
    container
  );
};

/**
 * Notification Component
 * Renders a single notification
 */
const Notification = ({ notification, onClose }) => {
  const { id, type, title, message } = notification;
  
  useEffect(() => {
    // Track when notification was rendered
    const startTime = Date.now();
    
    return () => {
      // Log long-lived notifications (potential memory leaks)
      const duration = Date.now() - startTime;
      if (duration > 10000) {
        console.warn(`Notification ${id} lived for ${duration}ms. Possible memory leak.`);
      }
    };
  }, [id]);
  
  // Get icon based on notification type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        );
      case 'warning':
        return (
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
      case 'error':
        return (
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        );
      case 'info':
      default:
        return (
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        );
    }
  };
  
  return (
    <div className={`notification notification-${type}`}>
      <div className="notification-icon">
        {getIcon()}
      </div>
      
      <div className="notification-content">
        {title && <div className="notification-title">{title}</div>}
        <div className="notification-message">{message}</div>
      </div>
      
      <button className="notification-close" onClick={onClose}>
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
};

// Export the hook for using notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
};

// Export singleton for direct imports
export const notifications = {
  info: (message, options) => {
    console.warn('Notifications not initialized yet. Fallback to console.');
    console.info(message);
  },
  success: (message, options) => {
    console.warn('Notifications not initialized yet. Fallback to console.');
    console.log(message);
  },
  warning: (message, options) => {
    console.warn('Notifications not initialized yet. Fallback to console.');
    console.warn(message);
  },
  error: (message, options) => {
    console.warn('Notifications not initialized yet. Fallback to console.');
    console.error(message);
  }
};

// Initialize the notification methods once the provider is mounted
export const initializeNotifications = () => {
  try {
    const context = useContext(NotificationContext);
    
    if (context) {
      notifications.info = context.info;
      notifications.success = context.success;
      notifications.warning = context.warning;
      notifications.error = context.error;
    }
  } catch (error) {
    console.error('Failed to initialize notifications:', error);
  }
};

export default NotificationContext;