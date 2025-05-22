use std::sync::Arc;

use actix_session::{Session, SessionExt};
use actix_web::{dev::Payload, Error, FromRequest, HttpMessage, HttpRequest};
use futures::future::{ready, Ready};
use serde::{Deserialize, Serialize};
use crate::auth::replit_auth::UserSession;
use crate::error::AppError;

/// Session data stored in cookies
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SessionData {
    pub user_session: Option<UserSession>,
}

impl SessionData {
    /// Create a new empty session
    pub fn new() -> Self {
        Self {
            user_session: None,
        }
    }
    
    /// Check if the user is authenticated
    pub fn is_authenticated(&self) -> bool {
        self.user_session.is_some()
    }
    
    /// Get the user ID if authenticated
    pub fn user_id(&self) -> Option<String> {
        self.user_session.as_ref().map(|s| s.claims.sub.clone())
    }
}

impl FromRequest for SessionData {
    type Error = Error;
    type Future = Ready<Result<Self, Self::Error>>;
    
    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        let session = req.get_session();
        let session_data = session.get::<SessionData>("session_data")
            .unwrap_or_else(|_| Some(SessionData::new()))
            .unwrap_or_else(SessionData::new);
            
        ready(Ok(session_data))
    }
}

/// Extension methods for the Session type
pub trait SessionExt2 {
    /// Save session data
    fn store_session_data(&self, data: &SessionData) -> Result<(), Error>;
    
    /// Clear the session data
    fn clear_session_data(&self) -> Result<(), Error>;
}

impl SessionExt2 for Session {
    fn store_session_data(&self, data: &SessionData) -> Result<(), Error> {
        self.insert("session_data", data)
            .map_err(|e| Error::from(AppError::InternalServer(format!("Session error: {}", e))))
    }
    
    fn clear_session_data(&self) -> Result<(), Error> {
        self.remove("session_data");
        Ok(())
    }
}