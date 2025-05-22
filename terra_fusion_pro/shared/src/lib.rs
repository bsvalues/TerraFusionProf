pub mod models;
pub mod utils;
pub mod db;
pub mod error;
pub mod config;
pub mod auth;
pub mod repository;

/// Re-export common types for convenience
pub use error::AppError;
pub use models::*;
pub use auth::replit_auth::ReplitAuth;
pub use auth::replit_auth::ReplitAuthConfig;
pub use auth::middleware::AuthenticationRequired;
pub use auth::session::{SessionData, SessionExt2};

/// Initialize the logging system
pub fn init_logging() {
    env_logger::init();
}

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}
