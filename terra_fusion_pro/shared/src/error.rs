use thiserror::Error;

/// Common error types for the TerraFusionPro platform
#[derive(Error, Debug)]
pub enum AppError {
    /// Database errors
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    /// Validation errors
    #[error("Validation error: {0}")]
    Validation(String),
    
    /// Authentication errors
    #[error("Authentication error: {0}")]
    Authentication(String),
    
    /// Authorization errors
    #[error("Authorization error: {0}")]
    Authorization(String),
    
    /// Not found errors
    #[error("Resource not found: {0}")]
    NotFound(String),
    
    /// Bad request errors
    #[error("Bad request: {0}")]
    BadRequest(String),
    
    /// Conflict errors
    #[error("Conflict: {0}")]
    Conflict(String),
    
    /// Internal server errors
    #[error("Internal server error: {0}")]
    InternalServer(String),
    
    /// External service errors
    #[error("External service error: {0}")]
    ExternalService(String),
    
    /// Deserialization errors
    #[error("Deserialization error: {0}")]
    Deserialization(#[from] serde_json::Error),
    
    /// IO errors
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

/// Result type alias for AppError
pub type AppResult<T> = Result<T, AppError>;

impl AppError {
    /// Get the HTTP status code for this error
    pub fn status_code(&self) -> u16 {
        match self {
            AppError::Database(_) => 500,
            AppError::Validation(_) => 400,
            AppError::Authentication(_) => 401,
            AppError::Authorization(_) => 403,
            AppError::NotFound(_) => 404,
            AppError::BadRequest(_) => 400,
            AppError::Conflict(_) => 409,
            AppError::InternalServer(_) => 500,
            AppError::ExternalService(_) => 502,
            AppError::Deserialization(_) => 400,
            AppError::Io(_) => 500,
        }
    }
    
    /// Get the error type as a string
    pub fn error_type(&self) -> &'static str {
        match self {
            AppError::Database(_) => "database_error",
            AppError::Validation(_) => "validation_error",
            AppError::Authentication(_) => "authentication_error",
            AppError::Authorization(_) => "authorization_error",
            AppError::NotFound(_) => "not_found",
            AppError::BadRequest(_) => "bad_request",
            AppError::Conflict(_) => "conflict",
            AppError::InternalServer(_) => "internal_server_error",
            AppError::ExternalService(_) => "external_service_error",
            AppError::Deserialization(_) => "deserialization_error",
            AppError::Io(_) => "io_error",
        }
    }
}