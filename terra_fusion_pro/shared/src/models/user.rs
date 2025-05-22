use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::types::Uuid;
use validator::Validate;

/// Represents a user in the TerraFusionPro platform
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    /// Unique identifier for the user
    pub id: Uuid,
    
    /// User's first name
    pub first_name: String,
    
    /// User's last name
    pub last_name: String,
    
    /// User's email address
    pub email: String,
    
    /// User's phone number (optional)
    pub phone: Option<String>,
    
    /// User's role in the system
    pub role: UserRole,
    
    /// Whether the user's account is active
    pub is_active: bool,
    
    /// When the user was created in the system
    pub created_at: DateTime<Utc>,
    
    /// When the user was last updated
    pub updated_at: DateTime<Utc>,
    
    /// When the user last logged in
    pub last_login: Option<DateTime<Utc>>,
}

/// Enumeration of user roles
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum UserRole {
    Admin,
    Appraiser,
    Analyst,
    Agent,
    Customer,
}

/// User credentials for authentication
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct UserCredentials {
    /// User's email address
    #[validate(email)]
    pub email: String,
    
    /// User's password
    #[validate(length(min = 8))]
    pub password: String,
}

/// User registration request
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct RegisterUserRequest {
    /// User's first name
    #[validate(length(min = 1, max = 50))]
    pub first_name: String,
    
    /// User's last name
    #[validate(length(min = 1, max = 50))]
    pub last_name: String,
    
    /// User's email address
    #[validate(email)]
    pub email: String,
    
    /// User's phone number (optional)
    #[validate(phone, required = false)]
    pub phone: Option<String>,
    
    /// User's password
    #[validate(length(min = 8))]
    pub password: String,
    
    /// User's role
    pub role: Option<UserRole>,
}

/// Represents the authentication result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthResult {
    /// JWT access token
    pub access_token: String,
    
    /// JWT refresh token
    pub refresh_token: String,
    
    /// User information
    pub user: User,
    
    /// Token expiration time in seconds
    pub expires_in: i64,
}

/// Request to update a user's profile
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct UpdateUserRequest {
    /// User's first name (optional)
    #[validate(length(min = 1, max = 50), required = false)]
    pub first_name: Option<String>,
    
    /// User's last name (optional)
    #[validate(length(min = 1, max = 50), required = false)]
    pub last_name: Option<String>,
    
    /// User's phone number (optional)
    #[validate(phone, required = false)]
    pub phone: Option<String>,
    
    /// User's role (optional, admin only)
    pub role: Option<UserRole>,
    
    /// Whether the user's account is active (optional, admin only)
    pub is_active: Option<bool>,
}