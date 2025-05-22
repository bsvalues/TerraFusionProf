pub mod auth_controller;

use actix_web::web;

/// Configure authentication routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    auth_controller::configure_routes(cfg);
}