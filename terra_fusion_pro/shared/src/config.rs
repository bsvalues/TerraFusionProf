use serde::Deserialize;
use std::env;

/// Configuration for the TerraFusionPro services
#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    /// Database configuration
    pub database: DatabaseConfig,
    
    /// Server configuration
    pub server: ServerConfig,
    
    /// Security configuration
    pub security: SecurityConfig,
    
    /// External services configuration
    pub services: ServicesConfig,
}

/// Database configuration
#[derive(Debug, Clone, Deserialize)]
pub struct DatabaseConfig {
    /// Database URL
    pub url: String,
    
    /// Maximum number of connections in the pool
    pub max_connections: u32,
    
    /// Whether to run migrations automatically
    pub run_migrations: bool,
}

/// Server configuration
#[derive(Debug, Clone, Deserialize)]
pub struct ServerConfig {
    /// Host to bind the server to
    pub host: String,
    
    /// Port to listen on
    pub port: u16,
    
    /// CORS allowed origins
    pub cors_origins: Vec<String>,
    
    /// Whether to enable HTTPS
    pub use_https: bool,
}

/// Security configuration
#[derive(Debug, Clone, Deserialize)]
pub struct SecurityConfig {
    /// JWT secret key
    pub jwt_secret: String,
    
    /// JWT token expiration in seconds
    pub jwt_expiration: u64,
    
    /// Refresh token expiration in seconds
    pub refresh_expiration: u64,
    
    /// Password hashing rounds
    pub password_hash_rounds: u32,
}

/// External services configuration
#[derive(Debug, Clone, Deserialize)]
pub struct ServicesConfig {
    /// Base URLs for all services
    pub service_urls: ServiceUrls,
    
    /// Third-party API keys
    pub api_keys: ApiKeys,
}

/// Service URLs
#[derive(Debug, Clone, Deserialize)]
pub struct ServiceUrls {
    pub api_gateway: String,
    pub property_service: String,
    pub user_service: String,
    pub report_service: String,
    pub form_service: String,
    pub analysis_service: String,
}

/// Third-party API keys
#[derive(Debug, Clone, Deserialize)]
pub struct ApiKeys {
    pub google_maps: Option<String>,
    pub zillow: Option<String>,
    pub aws_access_key: Option<String>,
    pub aws_secret_key: Option<String>,
}

impl Config {
    /// Load configuration from environment variables
    pub fn from_env() -> Self {
        let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
        let jwt_secret = env::var("JWT_SECRET").unwrap_or_else(|_| "default_jwt_secret_change_me_in_production".to_string());
        
        let host = env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
        let port_str = env::var("PORT").unwrap_or_else(|_| "5000".to_string());
        let port = port_str.parse::<u16>().expect("PORT must be a valid number");
        
        let max_connections = env::var("DB_MAX_CONNECTIONS")
            .map(|v| v.parse::<u32>().expect("DB_MAX_CONNECTIONS must be a valid number"))
            .unwrap_or(10);
            
        let run_migrations = env::var("RUN_MIGRATIONS")
            .map(|v| v.parse::<bool>().expect("RUN_MIGRATIONS must be a boolean"))
            .unwrap_or(true);
            
        let jwt_expiration = env::var("JWT_EXPIRATION")
            .map(|v| v.parse::<u64>().expect("JWT_EXPIRATION must be a valid number"))
            .unwrap_or(3600); // 1 hour default
            
        let refresh_expiration = env::var("REFRESH_EXPIRATION")
            .map(|v| v.parse::<u64>().expect("REFRESH_EXPIRATION must be a valid number"))
            .unwrap_or(604800); // 1 week default
            
        let password_hash_rounds = env::var("PASSWORD_HASH_ROUNDS")
            .map(|v| v.parse::<u32>().expect("PASSWORD_HASH_ROUNDS must be a valid number"))
            .unwrap_or(12);
            
        let cors_origins = env::var("CORS_ORIGINS")
            .map(|v| v.split(',').map(|s| s.trim().to_string()).collect())
            .unwrap_or_else(|_| vec!["*".to_string()]);
            
        let use_https = env::var("USE_HTTPS")
            .map(|v| v.parse::<bool>().expect("USE_HTTPS must be a boolean"))
            .unwrap_or(false);
            
        // Service URLs with default values pointing to localhost
        let api_gateway_url = env::var("API_GATEWAY_URL").unwrap_or_else(|_| "http://localhost:5002".to_string());
        let property_service_url = env::var("PROPERTY_SERVICE_URL").unwrap_or_else(|_| "http://localhost:5003".to_string());
        let user_service_url = env::var("USER_SERVICE_URL").unwrap_or_else(|_| "http://localhost:5004".to_string());
        let form_service_url = env::var("FORM_SERVICE_URL").unwrap_or_else(|_| "http://localhost:5005".to_string());
        let analysis_service_url = env::var("ANALYSIS_SERVICE_URL").unwrap_or_else(|_| "http://localhost:5006".to_string());
        let report_service_url = env::var("REPORT_SERVICE_URL").unwrap_or_else(|_| "http://localhost:5007".to_string());
        
        // API keys
        let google_maps_key = env::var("GOOGLE_MAPS_API_KEY").ok();
        let zillow_key = env::var("ZILLOW_API_KEY").ok();
        let aws_access_key = env::var("AWS_ACCESS_KEY_ID").ok();
        let aws_secret_key = env::var("AWS_SECRET_ACCESS_KEY").ok();
        
        Self {
            database: DatabaseConfig {
                url: database_url,
                max_connections,
                run_migrations,
            },
            server: ServerConfig {
                host,
                port,
                cors_origins,
                use_https,
            },
            security: SecurityConfig {
                jwt_secret,
                jwt_expiration,
                refresh_expiration,
                password_hash_rounds,
            },
            services: ServicesConfig {
                service_urls: ServiceUrls {
                    api_gateway: api_gateway_url,
                    property_service: property_service_url,
                    user_service: user_service_url,
                    report_service: report_service_url,
                    form_service: form_service_url,
                    analysis_service: analysis_service_url,
                },
                api_keys: ApiKeys {
                    google_maps: google_maps_key,
                    zillow: zillow_key,
                    aws_access_key,
                    aws_secret_key,
                },
            },
        }
    }
}