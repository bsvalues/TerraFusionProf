/**
 * TerraFusionPro - Dashboard Page Component
 * Main landing page after login with overview and quick actions
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { notifications } from '../components/layout/NotificationCenter';

// UI Components
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusIndicator from '../components/ui/StatusIndicator';
import DataSummary from '../components/dashboard/DataSummary';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import RecentItems from '../components/dashboard/RecentItems';
import QuickActions from '../components/dashboard/QuickActions';
import SystemStatus from '../components/dashboard/SystemStatus';

// Data Visualizations
import WorkloadChart from '../components/charts/WorkloadChart';
import ReportStatusChart from '../components/charts/ReportStatusChart';
import PropertyTypeChart from '../components/charts/PropertyTypeChart';

// Common Hooks
import useFetch from '../hooks/useFetch';

/**
 * Dashboard component with key user metrics and actionable items
 */
const Dashboard = () => {
  const [greeting, setGreeting] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Fetch dashboard data
  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError
  } = useFetch('/api/dashboard');
  
  // Set greeting based on time of day
  useEffect(() => {
    const hours = new Date().getHours();
    let newGreeting = '';
    
    if (hours < 12) {
      newGreeting = 'Good Morning';
    } else if (hours < 18) {
      newGreeting = 'Good Afternoon';
    } else {
      newGreeting = 'Good Evening';
    }
    
    setGreeting(newGreeting);
  }, []);
  
  // Show error notification if API call fails
  useEffect(() => {
    if (dashboardError) {
      notifications.error(
        'Failed to load dashboard data. Please try again later.',
        { title: 'Connection Error' }
      );
    }
  }, [dashboardError]);
  
  // Handle quick action button clicks
  const handleQuickAction = (action) => {
    switch (action) {
      case 'new-property':
        navigate('/properties/new');
        break;
      case 'new-report':
        navigate('/reports/new');
        break;
      case 'field-data':
        navigate('/field-data');
        break;
      case 'market-analysis':
        navigate('/market-analysis');
        break;
      default:
        break;
    }
  };
  
  return (
    <div className="dashboard-page">
      <div className="dashboard-welcome">
        <div className="welcome-message">
          <h1>{greeting}, {currentUser?.first_name || 'User'}!</h1>
          <p className="welcome-subtitle">
            Here's an overview of your work and recent activity.
          </p>
        </div>
        
        <div className="welcome-actions">
          <Button 
            variant="primary" 
            onClick={() => handleQuickAction('new-property')}
          >
            Add Property
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => handleQuickAction('new-report')}
          >
            Create Report
          </Button>
        </div>
      </div>
      
      {dashboardLoading ? (
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      ) : (
        <div className="dashboard-content">
          {/* Data Summary Cards */}
          <section className="dashboard-summary">
            <DataSummary 
              properties={dashboardData?.propertiesCount || 0}
              reports={dashboardData?.reportsCount || 0}
              pendingTasks={dashboardData?.pendingTasksCount || 0}
              completedTasks={dashboardData?.completedTasksCount || 0}
            />
          </section>
          
          {/* Main Dashboard Grid */}
          <div className="dashboard-grid">
            {/* Recent Activity */}
            <Card title="Recent Activity" className="card-activity" 
              action={{ label: 'View All', url: '/activity' }}>
              <ActivityFeed activities={dashboardData?.recentActivities || []} />
            </Card>
            
            {/* Workload and Tasks */}
            <Card title="Workload" className="card-workload"
              action={{ label: 'View Tasks', url: '/tasks' }}>
              <WorkloadChart data={dashboardData?.workload || []} />
              <div className="task-summary">
                <div className="task-metric">
                  <span className="task-count">{dashboardData?.pendingTasksCount || 0}</span>
                  <span className="task-label">Pending Tasks</span>
                </div>
                <div className="task-metric">
                  <span className="task-count">{dashboardData?.overdueTasksCount || 0}</span>
                  <span className="task-label">Overdue</span>
                </div>
                <div className="task-metric">
                  <span className="task-count">{dashboardData?.todayTasksCount || 0}</span>
                  <span className="task-label">Due Today</span>
                </div>
              </div>
            </Card>
            
            {/* Report Status */}
            <Card title="Report Status" className="card-reports"
              action={{ label: 'View Reports', url: '/reports' }}>
              <ReportStatusChart data={dashboardData?.reportStatus || []} />
              <div className="report-metrics">
                {dashboardData?.reportMetrics?.map((metric, index) => (
                  <div key={index} className="report-metric">
                    <StatusIndicator status={metric.status} />
                    <span className="metric-label">{metric.label}</span>
                    <span className="metric-count">{metric.count}</span>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Property Distribution */}
            <Card title="Property Distribution" className="card-properties"
              action={{ label: 'View Properties', url: '/properties' }}>
              <PropertyTypeChart data={dashboardData?.propertyTypes || []} />
            </Card>
            
            {/* Recent Properties */}
            <Card title="Recent Properties" className="card-recent-properties"
              action={{ label: 'View All', url: '/properties' }}>
              <RecentItems 
                items={dashboardData?.recentProperties || []} 
                type="property" 
                emptyMessage="No recent properties found"
              />
            </Card>
            
            {/* Recent Reports */}
            <Card title="Recent Reports" className="card-recent-reports"
              action={{ label: 'View All', url: '/reports' }}>
              <RecentItems 
                items={dashboardData?.recentReports || []} 
                type="report" 
                emptyMessage="No recent reports found"
              />
            </Card>
            
            {/* Quick Actions */}
            <Card title="Quick Actions" className="card-quick-actions">
              <QuickActions onAction={handleQuickAction} />
            </Card>
            
            {/* System Status */}
            <Card title="System Status" className="card-system-status">
              <SystemStatus services={dashboardData?.serviceStatus || []} />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;