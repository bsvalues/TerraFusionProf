// Main React application entry point
(function() {
  // Set up basic React DOM structure
  const rootElement = document.getElementById('root');
  
  // Simple router to handle our routes
  function Router() {
    const routes = {
      '/app': Dashboard,
      '/dashboard': Dashboard,
      '/upload': UploadPage,
      '/sync': SyncPage,
      '/login': LoginPage,
      '/register': RegisterPage,
      '/properties': PropertiesPage,
      '/reports': ReportsPage
    };

    // Get current path
    const path = window.location.pathname;
    let Component = routes[path];
    
    // Default to Dashboard if no matching route
    if (!Component) {
      Component = Dashboard;
    }
    
    return Component();
  }
  
  // Main Layout component
  function MainLayout({ children }) {
    return /*html*/`
      <div class="app-container">
        <div class="layout-wrapper">
          ${Sidebar()}
          
          <div class="layout-main">
            ${Header()}
            
            <main class="main-content">
              ${children}
            </main>
            
            ${Footer()}
          </div>
        </div>
      </div>
    `;
  }
  
  // Header component
  function Header() {
    return /*html*/`
      <header>
        <div class="header-title">TerraFusionPro</div>
        <div class="header-actions">
          <div class="header-action-item">
            <button class="btn btn-text">
              <span class="icon">🔔</span>
            </button>
          </div>
          <div class="header-action-item">
            <button class="btn btn-text">
              <span class="icon">👤</span>
              <span>John Doe</span>
            </button>
          </div>
        </div>
      </header>
    `;
  }
  
  // Sidebar component
  function Sidebar() {
    return /*html*/`
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <span class="logo-text">TerraFusionPro</span>
          </div>
          <button class="sidebar-toggle">◀</button>
        </div>
        
        <div class="user-info">
          <div class="user-avatar">J</div>
          <div class="user-details">
            <div class="user-name">John Doe</div>
            <div class="user-role">Administrator</div>
          </div>
        </div>
        
        <nav class="sidebar-nav">
          <ul class="nav-list">
            <li class="nav-item ${isActivePath('/dashboard') ? 'active' : ''}">
              <a href="/dashboard" class="nav-link">
                <span class="nav-icon">📊</span>
                <span class="nav-label">Dashboard</span>
              </a>
            </li>
            <li class="nav-item ${isActivePath('/upload') ? 'active' : ''}">
              <a href="/upload" class="nav-link">
                <span class="nav-icon">📁</span>
                <span class="nav-label">Upload Files</span>
              </a>
            </li>
            <li class="nav-item ${isActivePath('/sync') ? 'active' : ''}">
              <a href="/sync" class="nav-link">
                <span class="nav-icon">🔄</span>
                <span class="nav-label">Sync Data</span>
              </a>
            </li>
            <li class="nav-item ${isActivePath('/properties') ? 'active' : ''}">
              <a href="/properties" class="nav-link">
                <span class="nav-icon">🏠</span>
                <span class="nav-label">Properties</span>
              </a>
            </li>
            <li class="nav-item ${isActivePath('/reports') ? 'active' : ''}">
              <a href="/reports" class="nav-link">
                <span class="nav-icon">📝</span>
                <span class="nav-label">Reports</span>
              </a>
            </li>
          </ul>
        </nav>
        
        <div class="sidebar-footer">
          <div class="version">Version 1.0.0</div>
        </div>
      </aside>
    `;
  }
  
  // Footer component
  function Footer() {
    return /*html*/`
      <footer>
        <p>&copy; 2025 TerraFusionPro. All rights reserved.</p>
      </footer>
    `;
  }
  
  // Check if current path matches
  function isActivePath(path) {
    return window.location.pathname === path || 
          (path !== '/' && window.location.pathname.startsWith(path));
  }
  
  // Page Components
  function Dashboard() {
    return MainLayout({
      children: /*html*/`
        <div class="page-header">
          <h1>Dashboard</h1>
          <p class="page-description">Welcome to TerraFusionPro platform.</p>
        </div>
        
        <div class="dashboard-grid">
          <div class="card">
            <h2>Upload Files</h2>
            <p>Upload property data, reports, or other documents to the system.</p>
            <a href="/upload" class="btn btn-primary">Go to Upload</a>
          </div>
          
          <div class="card">
            <h2>Sync Data</h2>
            <p>Synchronize your data with the system.</p>
            <a href="/sync" class="btn btn-primary">Go to Sync</a>
          </div>
          
          <div class="card">
            <h2>Properties</h2>
            <p>View and manage your properties.</p>
            <a href="/properties" class="btn btn-primary">View Properties</a>
          </div>
          
          <div class="card">
            <h2>Reports</h2>
            <p>Access your appraisal reports.</p>
            <a href="/reports" class="btn btn-primary">View Reports</a>
          </div>
        </div>
      `
    });
  }
  
  function UploadPage() {
    return MainLayout({
      children: /*html*/`
        <div class="page-header">
          <h1>Upload Files</h1>
          <p class="page-description">
            Upload property data, reports, or other documents to the system.
          </p>
        </div>

        <div class="upload-section">
          <div class="section-header">
            <h2>Select Upload Type</h2>
          </div>

          <div class="upload-types">
            <div class="upload-type-card selected" onclick="selectUploadType(this, 'property')">
              <div class="card-icon">🏠</div>
              <h3>Property Data</h3>
              <p>Upload property information in CSV, JSON, or Excel format.</p>
            </div>
            
            <div class="upload-type-card" onclick="selectUploadType(this, 'report')">
              <div class="card-icon">📝</div>
              <h3>Appraisal Reports</h3>
              <p>Upload finalized appraisal reports in PDF format.</p>
            </div>
            
            <div class="upload-type-card" onclick="selectUploadType(this, 'document')">
              <div class="card-icon">📄</div>
              <h3>Supporting Documents</h3>
              <p>Upload supporting documentation for properties or appraisals.</p>
            </div>
          </div>
        </div>

        <div class="upload-content">
          <div class="file-upload-container">
            <div class="dropzone" id="dropzone">
              <div class="dropzone-content">
                <div class="dropzone-icon">
                  <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM13 10V7H11V10H8L12 14L16 10H13Z" fill="currentColor"/>
                  </svg>
                </div>
                <div class="dropzone-text">
                  <p>Drag & drop files here, or click to browse</p>
                  <p class="dropzone-info">
                    Accepted file types: CSV, JSON, Excel<br />
                    Maximum file size: 10MB
                  </p>
                </div>
              </div>
            </div>
            
            <div id="fileList" class="file-list" style="display: none;">
              <h4>Selected Files:</h4>
              <ul id="selectedFiles"></ul>
            </div>
            
            <div id="uploadProgress" class="upload-progress" style="display: none;">
              <div class="progress-container">
                <div class="progress-bar-outer" style="height: 10px;">
                  <div class="progress-bar-inner" id="progressBar" style="width: 0%;"></div>
                </div>
              </div>
              <p id="progressText">0% Uploaded</p>
            </div>
            
            <div class="upload-actions">
              <button class="btn btn-primary" id="uploadButton">Upload</button>
              <button class="btn btn-secondary" id="clearButton" style="display: none;">Clear Files</button>
            </div>
          </div>
        </div>
        
        <script>
          // File upload functionality
          document.addEventListener('DOMContentLoaded', function() {
            const dropzone = document.getElementById('dropzone');
            const fileList = document.getElementById('fileList');
            const selectedFiles = document.getElementById('selectedFiles');
            const uploadProgress = document.getElementById('uploadProgress');
            const progressBar = document.getElementById('progressBar');
            const progressText = document.getElementById('progressText');
            const uploadButton = document.getElementById('uploadButton');
            const clearButton = document.getElementById('clearButton');
            
            let files = [];
            
            // Handle file selection
            dropzone.addEventListener('click', function() {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.accept = '.csv,.json,.xlsx,.xls,.pdf,.doc,.docx';
              
              input.onchange = function(e) {
                const selectedFiles = Array.from(e.target.files);
                addFiles(selectedFiles);
              };
              
              input.click();
            });
            
            // Handle drag and drop
            dropzone.addEventListener('dragover', function(e) {
              e.preventDefault();
              this.classList.add('dropzone-active');
            });
            
            dropzone.addEventListener('dragleave', function() {
              this.classList.remove('dropzone-active');
            });
            
            dropzone.addEventListener('drop', function(e) {
              e.preventDefault();
              this.classList.remove('dropzone-active');
              
              if (e.dataTransfer.files.length) {
                addFiles(Array.from(e.dataTransfer.files));
              }
            });
            
            // Add files to the list
            function addFiles(newFiles) {
              for (const file of newFiles) {
                if (file.size > 10 * 1024 * 1024) {
                  alert(`File ${file.name} exceeds the 10MB size limit.`);
                  continue;
                }
                
                files.push(file);
              }
              
              updateFileList();
            }
            
            // Update file list display
            function updateFileList() {
              if (files.length > 0) {
                fileList.style.display = 'block';
                clearButton.style.display = 'inline-block';
                selectedFiles.innerHTML = '';
                
                files.forEach((file, index) => {
                  const li = document.createElement('li');
                  li.className = 'file-item';
                  
                  const nameSpan = document.createElement('span');
                  nameSpan.className = 'file-name';
                  nameSpan.textContent = file.name;
                  
                  const sizeSpan = document.createElement('span');
                  sizeSpan.className = 'file-size';
                  sizeSpan.textContent = `(${formatFileSize(file.size)})`;
                  
                  const removeButton = document.createElement('button');
                  removeButton.className = 'file-remove';
                  removeButton.textContent = '×';
                  removeButton.onclick = function(e) {
                    e.stopPropagation();
                    files.splice(index, 1);
                    updateFileList();
                  };
                  
                  li.appendChild(nameSpan);
                  li.appendChild(sizeSpan);
                  li.appendChild(removeButton);
                  selectedFiles.appendChild(li);
                });
              } else {
                fileList.style.display = 'none';
                clearButton.style.display = 'none';
              }
            }
            
            // Format file size
            function formatFileSize(bytes) {
              if (bytes === 0) return '0 Bytes';
              const k = 1024;
              const sizes = ['Bytes', 'KB', 'MB', 'GB'];
              const i = Math.floor(Math.log(bytes) / Math.log(k));
              return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            }
            
            // Upload files
            uploadButton.addEventListener('click', function() {
              if (files.length === 0) {
                alert('Please select files to upload');
                return;
              }
              
              // Simulate upload
              uploadProgress.style.display = 'block';
              uploadButton.disabled = true;
              clearButton.disabled = true;
              dropzone.style.pointerEvents = 'none';
              
              let progress = 0;
              const interval = setInterval(() => {
                progress += 5;
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `${progress}% Uploaded`;
                
                if (progress >= 100) {
                  clearInterval(interval);
                  setTimeout(() => {
                    // Show success message
                    alert('Files uploaded successfully!');
                    
                    // Reset form
                    files = [];
                    updateFileList();
                    uploadProgress.style.display = 'none';
                    uploadButton.disabled = false;
                    clearButton.disabled = false;
                    dropzone.style.pointerEvents = 'auto';
                    
                    // Redirect to sync page
                    window.location.href = '/sync';
                  }, 500);
                }
              }, 200);
            });
            
            // Clear files
            clearButton.addEventListener('click', function() {
              files = [];
              updateFileList();
            });
          });
          
          // Handle upload type selection
          function selectUploadType(element, type) {
            // Remove selected class from all cards
            const cards = document.querySelectorAll('.upload-type-card');
            cards.forEach(card => card.classList.remove('selected'));
            
            // Add selected class to clicked card
            element.classList.add('selected');
          }
        </script>
      `
    });
  }
  
  function SyncPage() {
    return MainLayout({
      children: /*html*/`
        <div class="page-header">
          <h1>Synchronize Data</h1>
          <p class="page-description">
            Synchronize your uploaded files with the system database.
          </p>
        </div>
        
        <div class="sync-container">
          <div class="section-header">
            <h2>Files Ready for Synchronization</h2>
          </div>
          
          <div class="file-list-container">
            <table class="file-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>properties-data.csv</td>
                  <td>CSV</td>
                  <td>2.4 MB</td>
                  <td>Ready</td>
                </tr>
                <tr>
                  <td>appraisal-report-q1.pdf</td>
                  <td>PDF</td>
                  <td>1.8 MB</td>
                  <td>Ready</td>
                </tr>
                <tr>
                  <td>market-analysis.xlsx</td>
                  <td>Excel</td>
                  <td>3.2 MB</td>
                  <td>Ready</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="action-buttons">
            <button class="btn btn-primary" id="syncButton">Start Synchronization</button>
          </div>
          
          <div class="sync-progress-container" id="syncProgress" style="display: none;">
            <h2>Synchronizing Data...</h2>
            <div class="progress-container">
              <div class="progress-bar-outer" style="height: 20px;">
                <div class="progress-bar-inner" id="syncProgressBar" style="width: 0%;"></div>
              </div>
            </div>
            <p class="sync-status-message">Processing 3 files. Please wait...</p>
          </div>
          
          <div class="sync-results" id="syncResults" style="display: none;">
            <div class="success-banner">
              <div class="success-icon">✓</div>
              <h2>Synchronization Complete</h2>
            </div>
            
            <div class="sync-summary">
              <h3>Summary</h3>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-value">3</div>
                  <div class="stat-label">Processed</div>
                </div>
                <div class="stat-card success">
                  <div class="stat-value">2</div>
                  <div class="stat-label">Created</div>
                </div>
                <div class="stat-card warning">
                  <div class="stat-value">1</div>
                  <div class="stat-label">Updated</div>
                </div>
                <div class="stat-card error">
                  <div class="stat-value">0</div>
                  <div class="stat-label">Failed</div>
                </div>
              </div>
            </div>
            
            <div class="action-buttons">
              <button class="btn btn-primary" onclick="window.location.href='/dashboard'">
                Go to Dashboard
              </button>
              <button class="btn btn-secondary" onclick="window.location.href='/upload'">
                Upload More Files
              </button>
              <button class="btn btn-tertiary" onclick="location.reload()">
                Reset
              </button>
            </div>
          </div>
        </div>
        
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            const syncButton = document.getElementById('syncButton');
            const syncProgress = document.getElementById('syncProgress');
            const syncProgressBar = document.getElementById('syncProgressBar');
            const syncResults = document.getElementById('syncResults');
            const fileListContainer = document.querySelector('.file-list-container');
            const actionButtons = document.querySelector('.action-buttons');
            
            // Start sync process
            syncButton.addEventListener('click', function() {
              fileListContainer.style.display = 'none';
              actionButtons.style.display = 'none';
              syncProgress.style.display = 'block';
              
              let progress = 0;
              const interval = setInterval(() => {
                progress += 2;
                syncProgressBar.style.width = `${progress}%`;
                
                if (progress >= 100) {
                  clearInterval(interval);
                  
                  setTimeout(() => {
                    syncProgress.style.display = 'none';
                    syncResults.style.display = 'block';
                  }, 500);
                }
              }, 100);
            });
          });
        </script>
      `
    });
  }
  
  function LoginPage() {
    return /*html*/`
      <div class="auth-container">
        <h1>Login</h1>
        <form>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" class="form-control" required>
          </div>
          <button type="button" class="btn btn-primary" style="width: 100%;" onclick="window.location.href='/dashboard'">Login</button>
        </form>
        <div class="auth-footer">
          <p>Don't have an account? <a href="/register">Register</a></p>
        </div>
      </div>
    `;
  }
  
  function RegisterPage() {
    return /*html*/`
      <div class="auth-container">
        <h1>Register</h1>
        <form>
          <div class="form-group">
            <label for="name">Full Name</label>
            <input type="text" id="name" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="confirm-password">Confirm Password</label>
            <input type="password" id="confirm-password" class="form-control" required>
          </div>
          <button type="button" class="btn btn-primary" style="width: 100%;" onclick="window.location.href='/dashboard'">Register</button>
        </form>
        <div class="auth-footer">
          <p>Already have an account? <a href="/login">Login</a></p>
        </div>
      </div>
    `;
  }
  
  function PropertiesPage() {
    return MainLayout({
      children: /*html*/`
        <div class="page-header">
          <h1>Properties</h1>
          <p class="page-description">View and manage your properties.</p>
        </div>
        
        <div class="empty-state">
          <div class="empty-icon">🏠</div>
          <h2>No Properties Found</h2>
          <p>Upload property data to get started.</p>
          <a href="/upload" class="btn btn-primary">Upload Property Data</a>
        </div>
      `
    });
  }
  
  function ReportsPage() {
    return MainLayout({
      children: /*html*/`
        <div class="page-header">
          <h1>Reports</h1>
          <p class="page-description">Access your appraisal reports.</p>
        </div>
        
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <h2>No Reports Found</h2>
          <p>Upload reports to get started.</p>
          <a href="/upload" class="btn btn-primary">Upload Reports</a>
        </div>
      `
    });
  }
  
  // Initialize the app
  function init() {
    if (rootElement) {
      rootElement.innerHTML = Router();
      
      // Handle navigation without page refresh
      document.addEventListener('click', (e) => {
        const target = e.target.closest('a');
        if (target && target.getAttribute('href').startsWith('/')) {
          e.preventDefault();
          const path = target.getAttribute('href');
          window.history.pushState({}, '', path);
          rootElement.innerHTML = Router();
        }
      });
      
      // Handle browser back/forward buttons
      window.addEventListener('popstate', () => {
        rootElement.innerHTML = Router();
      });
    }
  }
  
  // Start the application
  init();
})();