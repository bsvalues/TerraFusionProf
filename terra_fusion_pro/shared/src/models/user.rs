use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use validator::Validate;

/// Represents a user in the TerraFusionPro platform
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    /// Unique identifier for the user (Replit sub)
    pub id: String,
    
    /// User's email address
    pub email: Option<String>,
    
    /// User's first name
    pub first_name: Option<String>,
    
    /// User's last name
    pub last_name: Option<String>,
    
    /// User's profile image URL
    pub profile_image_url: Option<String>,
    
    /// When the user was created in the system
    pub created_at: DateTime<Utc>,
    
    /// When the user was last updated
    pub updated_at: DateTime<Utc>,
}

/// User information for upsert operations
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct UpsertUser {
    /// Unique identifier for the user (Replit sub)
    pub id: String,
    
    /// User's email address
    pub email: Option<String>,
    
    /// User's first name
    pub first_name: Option<String>,
    
    /// User's last name
    pub last_name: Option<String>,
    
    /// User's profile image URL
    pub profile_image_url: Option<String>,
}