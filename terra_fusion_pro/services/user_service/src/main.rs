mod api;
mod service;
mod repository;
mod graphql;
mod auth;

use std::sync::Arc;

use actix_session::storage::CookieSessionStore;
use actix_session::SessionMiddleware;
use actix_web::{web, App, HttpServer, middleware, cookie::Key};
use actix_web::http::header;
use dotenv::dotenv;
use shared::{config::Config, db::Database, ReplitAuth, ReplitAuthConfig};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize environment
    dotenv().ok();
    env_logger::init();
    let config = Config::from_env();
    
    // Initialize database connection
    let database = Database::new(&config.database.url)
        .await
        .expect("Failed to connect to database");
        
    if config.database.run_migrations {
        database.run_migrations()
            .await
            .expect("Failed to run database migrations");
    }
    
    let db = Arc::new(database);
    
    // Initialize Replit Auth
    let replit_auth_config = ReplitAuthConfig::from_env();
    let replit_auth = Arc::new(ReplitAuth::new(replit_auth_config));
    
    // Set up GraphQL schema
    let schema = graphql::create_schema(db.clone(), replit_auth.clone());
    
    // Generate a random key for session encryption
    let secret_key = Key::generate();
    
    // Create and start the HTTP server
    log::info!("Starting User Service on {}:{}", config.server.host, config.server.port);
    
    HttpServer::new(move || {
        // Configure CORS
        let cors = actix_web::middleware::DefaultHeaders::new()
            .add((header::ACCESS_CONTROL_ALLOW_ORIGIN, "*"))
            .add((header::ACCESS_CONTROL_ALLOW_METHODS, "GET, POST, PUT, DELETE, OPTIONS"))
            .add((header::ACCESS_CONTROL_ALLOW_HEADERS, "Content-Type, Authorization"));
            
        App::new()
            .app_data(web::Data::new(db.clone()))
            .app_data(web::Data::new(replit_auth.clone()))
            .app_data(web::Data::new(schema.clone()))
            // Add session middleware with cookie storage
            .wrap(
                SessionMiddleware::builder(CookieSessionStore::default(), secret_key.clone())
                    .cookie_secure(true)
                    .cookie_http_only(true)
                    .build(),
            )
            // Add CORS middleware
            .wrap(cors)
            // Add logging middleware
            .wrap(middleware::Logger::default())
            // Add health check endpoint
            .route("/health", web::get().to(health_check))
            // Add API routes
            .service(
                web::scope("/api/v1")
                    .configure(api::configure_routes)
            )
            // Add authentication routes
            .service(
                web::scope("/api/auth")
                    .configure(auth::configure_routes)
            )
            // Add GraphQL endpoint
            .service(
                web::scope("/graphql")
                    .configure(graphql::configure_routes)
            )
    })
    .bind((config.server.host, config.server.port))?
    .run()
    .await
}

/// Health check endpoint
async fn health_check() -> actix_web::HttpResponse {
    actix_web::HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "service": "user-service"
    }))
}
