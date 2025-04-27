/**
 * TerraFusionPro - Dashboard Page
 * Main dashboard view displaying key metrics and recent activities
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DataSummary from '../../components/dashboard/DataSummary';
import QuickActions from '../../components/dashboard/QuickActions';
import ActivityFeed from '../../components/dashboard/ActivityFeed';
import ServiceHealth from '../../components/dashboard/ServiceHealth';
import useFetch from '../../hooks/useFetch';

/**
 * DashboardPage Component
 */
const DashboardPage = () => {
  const { currentUser } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    properties: 0,
    reports: 0,
    pendingTasks: 0,
    completedTasks: 0,
    recentActivity: []
  });
  
  // Fetch dashboard data
  const { 
    data: apiData, 
    loading, 
    error, 
    refetch 
  } = useFetch('/api/dashboard');
  
  // Update local state when API data is fetched
  useEffect(() => {
    if (apiData) {
      setDashboardData(apiData);
    }
  }, [apiData]);
  
  // Handle quick action click
  const handleQuickAction = (actionId) => {
    // Map action IDs to their corresponding routes
    const actionRoutes = {
      'new-property': '/properties/new',
      'new-report': '/reports/new',
      'field-data': '/field-collection',
      'market-analysis': '/analytics/market',
      'upload-data': '/data/import',
      'generate-comps': '/analytics/comps'
    };
    
    // Navigate to the corresponding route
    if (actionRoutes[actionId]) {
      window.location.href = actionRoutes[actionId];
    }
  };
  
  // Handle dashboard refresh
  const handleRefresh = () => {
    refetch();
  };
  
  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="greeting-section">
          <h1 className="dashboard-title">
            Welcome, {currentUser?.firstName || 'User'}
          </h1>
          <p className="dashboard-subtitle">
            Here's an overview of your recent activities and key metrics
          </p>
        </div>
        
        <div className="dashboard-actions">
          <button 
            className="refresh-button"
            onClick={handleRefresh}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"></polyline>
              <polyline points="23 20 23 14 17 14"></polyline>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          
          <Link to="/reports/new" className="create-report-button">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            <span>New Report</span>
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="dashboard-error">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
          <button onClick={handleRefresh} className="retry-button">
            Try Again
          </button>
        </div>
      )}
      
      <div className="dashboard-content">
        <div className="dashboard-main">
          {/* Data Summary Cards */}
          <section className="dashboard-section">
            <DataSummary 
              properties={dashboardData.properties}
              reports={dashboardData.reports}
              pendingTasks={dashboardData.pendingTasks}
              completedTasks={dashboardData.completedTasks}
            />
          </section>
          
          {/* Quick Actions */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2 className="section-title">Quick Actions</h2>
            </div>
            <QuickActions onAction={handleQuickAction} />
          </section>
          
          {/* Activity Feed */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2 className="section-title">Recent Activity</h2>
              <Link to="/activity" className="section-link">
                View All
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </Link>
            </div>
            <ActivityFeed 
              activities={dashboardData.recentActivity} 
              limit={5}
              groupByDay={true}
            />
          </section>
        </div>
        
        <div className="dashboard-sidebar">
          {/* System Status */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2 className="section-title">System Status</h2>
              <Link to="/system/health" className="section-link">
                Details
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </Link>
            </div>
            <ServiceHealth showDetails={false} />
          </section>
          
          {/* Recent Reports */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2 className="section-title">Recent Reports</h2>
              <Link to="/reports" className="section-link">
                View All
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </Link>
            </div>
            
            <div className="recent-reports">
              {dashboardData.recentReports?.length > 0 ? (
                <ul className="report-list">
                  {dashboardData.recentReports.map(report => (
                    <li key={report.id} className="report-item">
                      <Link to={`/reports/${report.id}`} className="report-link">
                        <div className="report-icon">
                          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                        </div>
                        <div className="report-content">
                          <div className="report-name">{report.title}</div>
                          <div className="report-meta">
                            <span className="report-status">{report.status}</span>
                            <span className="report-date">{new Date(report.updated).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state">
                  <p>No recent reports found</p>
                  <Link to="/reports/new" className="create-link">
                    Create a Report
                  </Link>
                </div>
              )}
            </div>
          </section>
          
          {/* Upcoming Tasks */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2 className="section-title">Upcoming Tasks</h2>
              <Link to="/tasks" className="section-link">
                View All
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </Link>
            </div>
            
            <div className="upcoming-tasks">
              {dashboardData.upcomingTasks?.length > 0 ? (
                <ul className="task-list">
                  {dashboardData.upcomingTasks.map(task => (
                    <li key={task.id} className="task-item">
                      <div className="task-checkbox">
                        <input 
                          type="checkbox" 
                          id={`task-${task.id}`} 
                          checked={task.completed}
                          readOnly
                        />
                        <label htmlFor={`task-${task.id}`}></label>
                      </div>
                      <div className="task-content">
                        <div className="task-title">{task.title}</div>
                        <div className="task-meta">
                          <span className="task-due-date">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                          <span className={`task-priority ${task.priority.toLowerCase()}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state">
                  <p>No upcoming tasks</p>
                  <Link to="/tasks/new" className="create-link">
                    Create a Task
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;