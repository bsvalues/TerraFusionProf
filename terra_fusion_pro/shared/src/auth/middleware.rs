use std::future::{ready, Future, Ready};
use std::pin::Pin;
use std::rc::Rc;
use std::sync::Arc;
use std::task::{Context, Poll};

use actix_web::{
    body::EitherBody,
    dev::{self, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpResponse,
};
use chrono::Utc;

use crate::auth::session::{SessionData, SessionExt2};
use crate::auth::replit_auth::{ReplitAuth, ReplitAuthConfig};
use crate::db::Database;
use crate::repository::user_repository::UserRepository;

/// Authentication middleware to require login for protected routes
pub struct AuthenticationRequired {
    replit_auth: Arc<ReplitAuth>,
    db: Arc<Database>,
}

impl AuthenticationRequired {
    pub fn new(replit_auth: Arc<ReplitAuth>, db: Arc<Database>) -> Self {
        Self { replit_auth, db }
    }
}

impl<S, B> Transform<S, ServiceRequest> for AuthenticationRequired
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Transform = AuthenticationMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthenticationMiddleware {
            service: Rc::new(service),
            replit_auth: self.replit_auth.clone(),
            db: self.db.clone(),
        }))
    }
}

pub struct AuthenticationMiddleware<S> {
    service: Rc<S>,
    replit_auth: Arc<ReplitAuth>,
    db: Arc<Database>,
}

impl<S, B> Service<ServiceRequest> for AuthenticationMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    fn poll_ready(&self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let session = req.get_session();
        let session_data = session.get::<SessionData>("session_data")
            .unwrap_or_else(|_| Some(SessionData::new()))
            .unwrap_or_else(SessionData::new);
            
        // Check if user is authenticated
        if !session_data.is_authenticated() {
            let replit_auth = self.replit_auth.clone();
            let config = replit_auth.config.clone();
            
            // Generate a random state parameter for CSRF protection
            let state = uuid::Uuid::new_v4().to_string();
            
            // Store the original URL for redirection after login
            let original_url = req.uri().to_string();
            if let Err(e) = session.insert("original_url", original_url) {
                return Box::pin(async move {
                    Err(Error::from(std::io::Error::new(
                        std::io::ErrorKind::Other,
                        format!("Session error: {}", e),
                    )))
                });
            }
            
            // Store the state parameter in the session
            if let Err(e) = session.insert("auth_state", state.clone()) {
                return Box::pin(async move {
                    Err(Error::from(std::io::Error::new(
                        std::io::ErrorKind::Other,
                        format!("Session error: {}", e),
                    )))
                });
            }
            
            // Redirect to login
            let auth_url = config.auth_url(&state);
            let response = req.into_response(
                HttpResponse::Found()
                    .append_header(("Location", auth_url))
                    .finish()
                    .map_into_right_body(),
            );
            
            return Box::pin(async { Ok(response) });
        }
        
        // Check if token needs to be refreshed
        let needs_refresh = if let Some(user_session) = &session_data.user_session {
            let now = Utc::now().timestamp();
            user_session.expires_at <= now
        } else {
            false
        };
        
        if needs_refresh {
            let replit_auth = self.replit_auth.clone();
            let db = self.db.clone();
            let session_clone = session.clone();
            let mut session_data_clone = session_data.clone();
            
            return Box::pin(async move {
                // Try to refresh the token
                if let Some(user_session) = &session_data_clone.user_session {
                    if let Some(refresh_token) = &user_session.refresh_token {
                        match replit_auth.refresh_token(refresh_token).await {
                            Ok(token_response) => {
                                // Update the session with the new tokens
                                let id_token = token_response.id_token;
                                match replit_auth.decode_id_token(&id_token) {
                                    Ok(claims) => {
                                        // Update session with new tokens and claims
                                        session_data_clone.user_session = Some(crate::auth::replit_auth::UserSession {
                                            claims: claims.clone(),
                                            access_token: token_response.access_token,
                                            refresh_token: token_response.refresh_token,
                                            expires_at: Utc::now().timestamp() + token_response.expires_in,
                                        });
                                        
                                        // Store updated session
                                        if let Err(e) = session_clone.store_session_data(&session_data_clone) {
                                            return Err(e);
                                        }
                                        
                                        // Upsert user in the database
                                        let user_repository = UserRepository::new(db);
                                        let upsert_user = replit_auth.claims_to_user(&claims);
                                        if let Err(e) = user_repository.upsert_user(&upsert_user).await {
                                            log::error!("Failed to upsert user: {:?}", e);
                                            // Continue anyway, this shouldn't block the request
                                        }
                                    }
                                    Err(e) => {
                                        log::error!("Failed to decode ID token: {:?}", e);
                                        // Clear session and redirect to login
                                        if let Err(e) = session_clone.clear_session_data() {
                                            return Err(e);
                                        }
                                        
                                        let auth_url = replit_auth.config.auth_url(&uuid::Uuid::new_v4().to_string());
                                        let response = req.into_response(
                                            HttpResponse::Found()
                                                .append_header(("Location", auth_url))
                                                .finish()
                                                .map_into_right_body(),
                                        );
                                        
                                        return Ok(response);
                                    }
                                }
                            }
                            Err(e) => {
                                log::error!("Failed to refresh token: {:?}", e);
                                // Clear session and redirect to login
                                if let Err(e) = session_clone.clear_session_data() {
                                    return Err(e);
                                }
                                
                                let auth_url = replit_auth.config.auth_url(&uuid::Uuid::new_v4().to_string());
                                let response = req.into_response(
                                    HttpResponse::Found()
                                        .append_header(("Location", auth_url))
                                        .finish()
                                        .map_into_right_body(),
                                );
                                
                                return Ok(response);
                            }
                        }
                    }
                }
                
                // Continue with the request
                let res = self.service.call(req).await?;
                Ok(res.map_into_left_body())
            });
        }
        
        // Continue with the request
        let fut = self.service.call(req);
        Box::pin(async move {
            let res = fut.await?;
            Ok(res.map_into_left_body())
        })
    }
}