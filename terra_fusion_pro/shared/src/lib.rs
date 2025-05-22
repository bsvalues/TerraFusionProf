pub mod models;
pub mod utils;
pub mod db;
pub mod error;
pub mod config;

/// Re-export common types for convenience
pub use error::AppError;
pub use models::*;

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
