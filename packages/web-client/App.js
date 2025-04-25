/**
 * TerraFusionPro Web Client - Main App Component
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';

// Placeholder for future pages
const Dashboard = () => (
  <div className="dashboard-container">
    <h1>Dashboard</h1>
    <div className="dashboard">
      <div className="card">
        <h2>Recent Properties</h2>
        <p>You have 12 properties in your portfolio.</p>
        <a href="/properties" className="btn btn-primary">View All</a>
      </div>
      
      <div className="card">
        <h2>Appraisal Reports</h2>
        <p>5 reports need your attention.</p>
        <a href="/reports" className="btn btn-primary">View Reports</a>
      </div>
      
      <div className="card">
        <h2>Market Insights</h2>
        <p>Property values increased by 3.2% in your area.</p>
        <a href="/analysis" className="btn btn-primary">View Analysis</a>
      </div>
      
      <div className="card">
        <h2>Field Collection</h2>
        <p>7 properties scheduled for inspection this week.</p>
        <a href="/fieldwork" className="btn btn-primary">Field App</a>
      </div>
    </div>
  </div>
);

const Properties = () => <h1>Properties Page</h1>;
const Reports = () => <h1>Reports Page</h1>;
const Analysis = () => <h1>Analysis Page</h1>;
const Account = () => <h1>Account Page</h1>;
const NotFound = () => <h1>404 - Page Not Found</h1>;

const App = () => {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/account" element={<Account />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;