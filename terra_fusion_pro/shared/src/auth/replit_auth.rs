use uuid::Uuid;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use reqwest::Client;
use crate::error::{AppError, AppResult};
use crate::models::user::{User, UpsertUser};

/// Replit Auth configuration
#[derive(Debug, Clone)]
pub struct ReplitAuthConfig {
    /// The OpenID-connect issuer URL
    pub issuer_url: String,
    
    /// Replit ID from the environment
    pub repl_id: String,
    
    /// Callback URL for the auth flow
    pub callback_url: String,
    
    /// Domain where the app is running
    pub domain: String,
}

impl ReplitAuthConfig {
    /// Create a new config from environment variables
    pub fn from_env() -> Self {
        let issuer_url = std::env::var("ISSUER_URL")
            .unwrap_or_else(|_| "https://replit.com/oidc".to_string());
            
        let repl_id = std::env::var("REPL_ID")
            .expect("REPL_ID environment variable not found");
            
        let domain = std::env::var("REPLIT_DOMAINS")
            .expect("REPLIT_DOMAINS environment variable not found")
            .split(',')
            .next()
            .expect("No domain found in REPLIT_DOMAINS")
            .to_string();
            
        let callback_url = format!("https://{}/api/callback", domain);
        
        Self {
            issuer_url,
            repl_id,
            callback_url,
            domain,
        }
    }
    
    /// Get the OpenID Configuration URL
    pub fn discovery_url(&self) -> String {
        format!("{}", self.issuer_url)
    }
    
    /// Get the Authorization URL
    pub fn auth_url(&self, state: &str) -> String {
        format!(
            "{}/auth?client_id={}&redirect_uri={}&response_type=code&scope=openid%20email%20profile%20offline_access&state={}",
            self.issuer_url, self.repl_id, self.callback_url, state
        )
    }
    
    /// Get the token endpoint
    pub fn token_url(&self) -> String {
        format!("{}/token", self.issuer_url)
    }
    
    /// Get the end session endpoint for logout
    pub fn end_session_url(&self, redirect_uri: &str) -> String {
        format!(
            "{}/logout?client_id={}&post_logout_redirect_uri={}",
            self.issuer_url, self.repl_id, redirect_uri
        )
    }
}

/// OpenID Connect Token response
#[derive(Debug, Deserialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub id_token: String,
    pub expires_in: i64,
    pub token_type: String,
}

/// User claims from an ID token
#[derive(Debug, Deserialize)]
pub struct UserClaims {
    pub sub: String,
    pub email: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub profile_image_url: Option<String>,
    pub iat: i64,
    pub exp: i64,
}

/// User session with authentication details
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserSession {
    pub claims: UserClaims,
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: i64,
}

/// Replit authentication client
#[derive(Debug, Clone)]
pub struct ReplitAuth {
    config: ReplitAuthConfig,
    http_client: Client,
}

impl ReplitAuth {
    /// Create a new Replit auth client
    pub fn new(config: ReplitAuthConfig) -> Self {
        Self {
            config,
            http_client: Client::new(),
        }
    }
    
    /// Exchange an authorization code for tokens
    pub async fn exchange_code(&self, code: &str) -> AppResult<TokenResponse> {
        let token_request = self.http_client.post(&self.config.token_url())
            .form(&[
                ("grant_type", "authorization_code"),
                ("code", code),
                ("redirect_uri", &self.config.callback_url),
                ("client_id", &self.config.repl_id),
            ]);
            
        let token_response = token_request.send().await
            .map_err(|e| AppError::ExternalService(format!("Failed to exchange code: {}", e)))?;
            
        if !token_response.status().is_success() {
            let error_text = token_response.text().await
                .unwrap_or_else(|_| "Unknown error".to_string());
                
            return Err(AppError::Authentication(format!("Token exchange failed: {}", error_text)));
        }
        
        let tokens: TokenResponse = token_response.json().await
            .map_err(|e| AppError::Deserialization(e))?;
            
        Ok(tokens)
    }
    
    /// Decode and validate an ID token
    pub fn decode_id_token(&self, id_token: &str) -> AppResult<UserClaims> {
        // In a real implementation, we would properly validate the JWT signature
        // For this example, we'll parse it without validation
        let parts: Vec<&str> = id_token.split('.').collect();
        
        if parts.len() != 3 {
            return Err(AppError::Authentication("Invalid ID token format".to_string()));
        }
        
        let payload = base64_decode(parts[1])?;
        let claims: UserClaims = serde_json::from_str(&payload)
            .map_err(|e| AppError::Deserialization(e))?;
            
        // Check expiration
        let now = Utc::now().timestamp();
        if claims.exp < now {
            return Err(AppError::Authentication("ID token has expired".to_string()));
        }
        
        Ok(claims)
    }
    
    /// Refresh an access token
    pub async fn refresh_token(&self, refresh_token: &str) -> AppResult<TokenResponse> {
        let refresh_request = self.http_client.post(&self.config.token_url())
            .form(&[
                ("grant_type", "refresh_token"),
                ("refresh_token", refresh_token),
                ("client_id", &self.config.repl_id),
            ]);
            
        let refresh_response = refresh_request.send().await
            .map_err(|e| AppError::ExternalService(format!("Failed to refresh token: {}", e)))?;
            
        if !refresh_response.status().is_success() {
            let error_text = refresh_response.text().await
                .unwrap_or_else(|_| "Unknown error".to_string());
                
            return Err(AppError::Authentication(format!("Token refresh failed: {}", error_text)));
        }
        
        let tokens: TokenResponse = refresh_response.json().await
            .map_err(|e| AppError::Deserialization(e))?;
            
        Ok(tokens)
    }
    
    /// Convert claims to a user object for database storage
    pub fn claims_to_user(&self, claims: &UserClaims) -> UpsertUser {
        UpsertUser {
            id: claims.sub.clone(),
            email: claims.email.clone(),
            first_name: claims.first_name.clone(),
            last_name: claims.last_name.clone(),
            profile_image_url: claims.profile_image_url.clone(),
        }
    }
}

/// Base64 decode a JWT segment
fn base64_decode(input: &str) -> AppResult<String> {
    // In a real implementation, use proper base64 URL-safe decoding
    // This is a simplified example
    Ok(String::from_utf8(
        base64::decode(input.replace('-', "+").replace('_', "/"))
            .map_err(|_| AppError::Authentication("Invalid base64 encoding in token".to_string()))?
    )
    .map_err(|_| AppError::Authentication("Invalid UTF-8 in token".to_string()))?)
}