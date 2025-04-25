/**
 * TerraFusionPro Web Client - Static File Server
 * 
 * Simple HTTP server without Express dependencies to avoid path-to-regexp issues
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.WEB_CLIENT_PORT || 5000;

// MIME types for different file extensions
const CONTENT_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

// Ensure the public directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create the index.html file
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TerraFusionPro</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    :root {
      --primary-color: #2563eb;
      --primary-dark: #1e40af;
      --primary-light: #60a5fa;
      --secondary-color: #10b981;
      --text-color: #333;
      --light-gray: #f9fafb;
      --gray: #e5e7eb;
      --dark-gray: #4b5563;
      --danger: #ef4444;
      --warning: #f59e0b;
      --success: #10b981;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: var(--text-color);
      background-color: var(--light-gray);
    }
    
    .container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    
    /* Navbar */
    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background-color: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .logo {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--primary-color);
    }
    
    .nav-links {
      display: flex;
      gap: 1.5rem;
      align-items: center;
    }
    
    /* Main Content */
    .main-content {
      min-height: calc(100vh - 140px);
      padding: 2rem 0;
    }
    
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    
    /* Dashboard */
    .dashboard-container {
      padding: 0 2rem;
    }
    
    .dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 1.5rem;
    }
    
    .card {
      background-color: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }
    
    .card h2 {
      color: var(--primary-dark);
      margin-bottom: 1rem;
      font-size: 1.25rem;
    }
    
    .card p {
      margin-bottom: 1.5rem;
      color: var(--dark-gray);
    }
    
    /* Buttons */
    .btn {
      display: inline-block;
      padding: 0.6rem 1.2rem;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
    }
    
    .btn-primary {
      background-color: var(--primary-color);
      color: white;
    }
    
    .btn-primary:hover {
      background-color: var(--primary-dark);
    }
    
    .btn-text {
      color: var(--dark-gray);
      background: none;
    }
    
    .btn-text:hover {
      color: var(--primary-color);
    }
    
    /* Footer */
    .footer {
      background-color: #1a202c;
      color: white;
      padding: 3rem 0 1.5rem;
    }
    
    .footer-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }
    
    .footer-section h3 {
      margin-bottom: 1.2rem;
      font-size: 1.2rem;
      color: #60a5fa;
    }
    
    .footer-links {
      list-style: none;
    }
    
    .footer-links li {
      margin-bottom: 0.7rem;
    }
    
    .footer-links a {
      color: #e5e7eb;
      text-decoration: none;
      transition: color 0.3s ease;
    }
    
    .footer-links a:hover {
      color: var(--primary-light);
    }
    
    .footer-bottom {
      text-align: center;
      padding-top: 1.5rem;
      border-top: 1px solid #2d3748;
      color: #a0aec0;
      font-size: 0.9rem;
    }
    
    /* Login/Register Form */
    .auth-container {
      max-width: 400px;
      margin: 2rem auto;
      padding: 2rem;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .auth-container h1 {
      text-align: center;
      margin-bottom: 1.5rem;
      color: var(--primary-dark);
    }
    
    .form-group {
      margin-bottom: 1.5rem;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    
    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--gray);
      border-radius: 4px;
      font-size: 1rem;
    }
    
    .form-control:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    
    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
    }
    
    .auth-footer a {
      color: var(--primary-color);
      text-decoration: none;
    }
    
    .auth-footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    // Create a context for authentication
    const AuthContext = React.createContext();
    
    // Auth Provider Component
    const AuthProvider = ({ children }) => {
      const [currentUser, setCurrentUser] = React.useState(null);
      const [loading, setLoading] = React.useState(true);
      
      React.useEffect(() => {
        // Check for stored user in localStorage
        const storedUser = localStorage.getItem('terraFusionUser');
        
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }
        
        setLoading(false);
      }, []);
      
      // Login function
      const login = async (email, password) => {
        // In a real app, this would call an API
        // For demo, we'll simulate a successful login with hardcoded credentials
        if (email === 'admin@terrafusionpro.com' && password === 'admin123') {
          const user = {
            id: 'admin1',
            name: 'Admin User',
            email: email,
            role: 'admin'
          };
          
          setCurrentUser(user);
          localStorage.setItem('terraFusionUser', JSON.stringify(user));
          return user;
        }
        
        throw new Error('Invalid email or password');
      };
      
      // Logout function
      const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('terraFusionUser');
      };
      
      const value = {
        currentUser,
        loading,
        login,
        logout,
        isAuthenticated: !!currentUser
      };
      
      return (
        <AuthContext.Provider value={value}>
          {!loading && children}
        </AuthContext.Provider>
      );
    };
    
    // Hook to use auth context
    const useAuth = () => React.useContext(AuthContext);
    
    // Header Component
    const Header = () => {
      const { currentUser, logout } = useAuth();
      
      return (
        <header className="navbar">
          <div className="logo">
            <svg width="180" height="45" viewBox="0 0 240 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g>
                <path d="M45 15L30 5L15 15V35L30 45L45 35V15Z" fill="#2563EB"/>
                <path d="M30 5L15 15V35L30 45V25L45 15V35L30 45L45 35V15L30 5Z" fill="#1E40AF"/>
                <path d="M30 5V25L15 15L30 5Z" fill="#60A5FA"/>
                <path d="M30 25L30 45L15 35V15L30 25Z" fill="#3B82F6"/>
              </g>
              <text x="60" y="35" fill="#2563EB" fontSize="24" fontWeight="bold">TerraFusionPro</text>
            </svg>
          </div>
          
          <nav className="nav-links">
            {currentUser ? (
              <>
                <a href="#/" className="btn btn-text">Dashboard</a>
                <a href="#/properties" className="btn btn-text">Properties</a>
                <a href="#/reports" className="btn btn-text">Reports</a>
                <a href="#/analysis" className="btn btn-text">Analysis</a>
                <button onClick={logout} className="btn btn-primary">Logout</button>
              </>
            ) : (
              <>
                <a href="#/login" className="btn btn-primary">Login</a>
              </>
            )}
          </nav>
        </header>
      );
    };
    
    // Footer Component
    const Footer = () => {
      const currentYear = new Date().getFullYear();
      
      return (
        <footer className="footer">
          <div className="container">
            <div className="footer-content">
              <div className="footer-section">
                <h3>TerraFusionPro</h3>
                <p>Next-generation real estate appraisal platform combining field data collection, geospatial analysis, and AI-powered valuation tools.</p>
              </div>
              
              <div className="footer-section">
                <h3>Quick Links</h3>
                <ul className="footer-links">
                  <li><a href="#/about">About Us</a></li>
                  <li><a href="#/contact">Contact</a></li>
                  <li><a href="#/pricing">Pricing</a></li>
                  <li><a href="#/docs">Documentation</a></li>
                </ul>
              </div>
              
              <div className="footer-section">
                <h3>Resources</h3>
                <ul className="footer-links">
                  <li><a href="#/blog">Blog</a></li>
                  <li><a href="#/help">Help Center</a></li>
                  <li><a href="#/api">API</a></li>
                  <li><a href="#/terms">Terms of Service</a></li>
                </ul>
              </div>
            </div>
            
            <div className="footer-bottom">
              <p>&copy; {currentYear} TerraFusionPro. All rights reserved.</p>
            </div>
          </div>
        </footer>
      );
    };
    
    // Login Component
    const Login = () => {
      const [email, setEmail] = React.useState('');
      const [password, setPassword] = React.useState('');
      const [error, setError] = React.useState('');
      const { login } = useAuth();
      const navigate = useNavigate();
      
      const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
          await login(email, password);
          navigate('/');
        } catch (err) {
          setError(err.message);
        }
      };
      
      return (
        <div className="auth-container">
          <h1>Login</h1>
          
          {error && (
            <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                className="form-control" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                className="form-control" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Login
            </button>
          </form>
          
          <div className="auth-footer">
            <p>Don't have an account? <a href="#/register">Register</a></p>
          </div>
          
          <div className="auth-footer" style={{ marginTop: '0.5rem' }}>
            <p><strong>Demo credentials:</strong> admin@terrafusionpro.com / admin123</p>
          </div>
        </div>
      );
    };
    
    // Dashboard Component
    const Dashboard = () => (
      <div className="dashboard-container">
        <h1>Dashboard</h1>
        <div className="dashboard">
          <div className="card">
            <h2>Recent Properties</h2>
            <p>You have 12 properties in your portfolio.</p>
            <a href="#/properties" className="btn btn-primary">View All</a>
          </div>
          
          <div className="card">
            <h2>Appraisal Reports</h2>
            <p>5 reports need your attention.</p>
            <a href="#/reports" className="btn btn-primary">View Reports</a>
          </div>
          
          <div className="card">
            <h2>Market Insights</h2>
            <p>Property values increased by 3.2% in your area.</p>
            <a href="#/analysis" className="btn btn-primary">View Analysis</a>
          </div>
          
          <div className="card">
            <h2>Field Collection</h2>
            <p>7 properties scheduled for inspection this week.</p>
            <a href="#/fieldwork" className="btn btn-primary">Field App</a>
          </div>
        </div>
      </div>
    );
    
    // Simple Page Components
    const Properties = () => <h1 style={{ padding: '2rem' }}>Properties Page</h1>;
    const Reports = () => <h1 style={{ padding: '2rem' }}>Reports Page</h1>;
    const Analysis = () => <h1 style={{ padding: '2rem' }}>Analysis Page</h1>;
    const NotFound = () => <h1 style={{ padding: '2rem' }}>404 - Page Not Found</h1>;
    
    // Simple Router Implementation
    const Route = ({ path, children }) => {
      const [currentPath, setCurrentPath] = React.useState(window.location.hash.substring(1) || '/');
      
      React.useEffect(() => {
        const onHashChange = () => {
          setCurrentPath(window.location.hash.substring(1) || '/');
        };
        
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
      }, []);
      
      return path === currentPath ? children : null;
    };
    
    // useNavigate Hook
    const useNavigate = () => {
      return (path) => {
        window.location.hash = path;
      };
    };
    
    // Private Route Component
    const PrivateRoute = ({ children }) => {
      const { isAuthenticated } = useAuth();
      const navigate = useNavigate();
      
      React.useEffect(() => {
        if (!isAuthenticated) {
          navigate('/login');
        }
      }, [isAuthenticated, navigate]);
      
      return isAuthenticated ? children : null;
    };
    
    // App Component
    const App = () => {
      return (
        <AuthProvider>
          <div className="app-container">
            <Header />
            <main className="main-content">
              <Route path="/">
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              </Route>
              <Route path="/login">
                <Login />
              </Route>
              <Route path="/properties">
                <PrivateRoute>
                  <Properties />
                </PrivateRoute>
              </Route>
              <Route path="/reports">
                <PrivateRoute>
                  <Reports />
                </PrivateRoute>
              </Route>
              <Route path="/analysis">
                <PrivateRoute>
                  <Analysis />
                </PrivateRoute>
              </Route>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      );
    };
    
    // Render the App
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>`;

// Write the index.html file
fs.writeFileSync(path.join(publicDir, 'index.html'), htmlContent);

// Create the HTTP server
const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Parse the URL
  let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
  
  // Get the file extension
  const extname = path.extname(filePath);
  
  // Default to text/html for unspecified content types
  let contentType = CONTENT_TYPES[extname] || 'text/html';
  
  // Read the file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Page not found - return index.html for SPA routing
        fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, content) => {
          if (err) {
            // If even the index file is missing, return 500
            res.writeHead(500);
            res.end('Server Error: Could not find index.html');
            return;
          }
          
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf8');
        });
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf8');
    }
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`TerraFusionPro Web Client running on port ${PORT}`);
});

export default server;