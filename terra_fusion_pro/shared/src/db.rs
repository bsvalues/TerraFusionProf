use std::sync::Arc;

use sqlx::{postgres::PgPoolOptions, PgPool};
use tokio::sync::Mutex;

use crate::error::{AppError, AppResult};

/// Database connection manager
#[derive(Clone)]
pub struct Database {
    pool: Arc<PgPool>,
    migrations_run: Arc<Mutex<bool>>,
}

impl Database {
    /// Create a new database connection
    pub async fn new(database_url: &str) -> AppResult<Self> {
        let pool = PgPoolOptions::new()
            .max_connections(10)
            .connect(database_url)
            .await
            .map_err(|e| AppError::Database(e))?;
            
        Ok(Self {
            pool: Arc::new(pool),
            migrations_run: Arc::new(Mutex::new(false)),
        })
    }
    
    /// Get a reference to the connection pool
    pub fn pool(&self) -> &PgPool {
        &self.pool
    }
    
    /// Run database migrations
    pub async fn run_migrations(&self) -> AppResult<()> {
        let mut migrations_run = self.migrations_run.lock().await;
        
        if !*migrations_run {
            sqlx::migrate!("./migrations")
                .run(self.pool())
                .await
                .map_err(|e| AppError::Database(e))?;
                
            *migrations_run = true;
        }
        
        Ok(())
    }
    
    /// Check if the database connection is healthy
    pub async fn health_check(&self) -> AppResult<()> {
        sqlx::query("SELECT 1")
            .execute(self.pool())
            .await
            .map_err(|e| AppError::Database(e))?;
            
        Ok(())
    }
}

/// Generate table names for each model
pub struct TableNames;

impl TableNames {
    pub const USERS: &'static str = "users";
    pub const PROPERTIES: &'static str = "properties";
    pub const REPORTS: &'static str = "reports";
    pub const FORM_TEMPLATES: &'static str = "form_templates";
    pub const FORM_INSTANCES: &'static str = "form_instances";
    pub const APPRAISALS: &'static str = "appraisals";
    pub const COMPARABLES: &'static str = "comparables";
    pub const MARKET_DATA: &'static str = "market_data";
}

/// Repository trait for database operations
#[async_trait::async_trait]
pub trait Repository<T, ID> {
    /// Create a new record
    async fn create(&self, item: &T) -> AppResult<T>;
    
    /// Get a record by ID
    async fn get_by_id(&self, id: ID) -> AppResult<T>;
    
    /// Update a record
    async fn update(&self, id: ID, item: &T) -> AppResult<T>;
    
    /// Delete a record
    async fn delete(&self, id: ID) -> AppResult<()>;
    
    /// Get all records
    async fn get_all(&self) -> AppResult<Vec<T>>;
}

/// Pagination helper
pub struct Pagination {
    pub page: i64,
    pub page_size: i64,
}

impl Pagination {
    pub fn new(page: i64, page_size: i64) -> Self {
        Self {
            page: page.max(1),
            page_size: page_size.clamp(1, 100),
        }
    }
    
    pub fn offset(&self) -> i64 {
        (self.page - 1) * self.page_size
    }
    
    pub fn limit(&self) -> i64 {
        self.page_size
    }
}