use std::sync::Arc;

use async_trait::async_trait;
use chrono::Utc;
use sqlx::{FromRow, postgres::PgRow, Row};
use crate::db::{Database, Repository, TableNames};
use crate::error::{AppError, AppResult};
use crate::models::user::{User, UpsertUser};

#[derive(Debug, Clone)]
pub struct UserRepository {
    db: Arc<Database>,
}

impl UserRepository {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }
    
    /// Find a user by their email
    pub async fn find_by_email(&self, email: &str) -> AppResult<Option<User>> {
        let query = sqlx::query(
            "SELECT * FROM users WHERE email = $1"
        )
        .bind(email);
        
        let result = query.fetch_optional(self.db.pool())
            .await
            .map_err(|e| AppError::Database(e))?;
            
        if let Some(row) = result {
            Ok(Some(self.map_row_to_user(row)?))
        } else {
            Ok(None)
        }
    }
    
    /// Upsert a user (insert if not exists, update if exists)
    pub async fn upsert_user(&self, user: &UpsertUser) -> AppResult<User> {
        let now = Utc::now();
        
        let query = sqlx::query(
            "INSERT INTO users (id, email, first_name, last_name, profile_image_url, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                profile_image_url = EXCLUDED.profile_image_url,
                updated_at = EXCLUDED.updated_at
             RETURNING *"
        )
        .bind(&user.id)
        .bind(&user.email)
        .bind(&user.first_name)
        .bind(&user.last_name)
        .bind(&user.profile_image_url)
        .bind(now)
        .bind(now);
        
        let row = query.fetch_one(self.db.pool())
            .await
            .map_err(|e| AppError::Database(e))?;
            
        self.map_row_to_user(row)
    }
    
    /// Convert a database row to a User
    fn map_row_to_user(&self, row: PgRow) -> AppResult<User> {
        Ok(User {
            id: row.try_get("id")
                .map_err(|e| AppError::Database(e))?,
            email: row.try_get("email")
                .map_err(|e| AppError::Database(e))?,
            first_name: row.try_get("first_name")
                .map_err(|e| AppError::Database(e))?,
            last_name: row.try_get("last_name")
                .map_err(|e| AppError::Database(e))?,
            profile_image_url: row.try_get("profile_image_url")
                .map_err(|e| AppError::Database(e))?,
            created_at: row.try_get("created_at")
                .map_err(|e| AppError::Database(e))?,
            updated_at: row.try_get("updated_at")
                .map_err(|e| AppError::Database(e))?,
        })
    }
}

#[async_trait]
impl Repository<User, String> for UserRepository {
    async fn create(&self, user: &User) -> AppResult<User> {
        let now = Utc::now();
        
        let query = sqlx::query(
            "INSERT INTO users (id, email, first_name, last_name, profile_image_url, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *"
        )
        .bind(&user.id)
        .bind(&user.email)
        .bind(&user.first_name)
        .bind(&user.last_name)
        .bind(&user.profile_image_url)
        .bind(now)
        .bind(now);
        
        let row = query.fetch_one(self.db.pool())
            .await
            .map_err(|e| AppError::Database(e))?;
            
        self.map_row_to_user(row)
    }

    async fn get_by_id(&self, id: String) -> AppResult<User> {
        let query = sqlx::query(
            "SELECT * FROM users WHERE id = $1"
        )
        .bind(id);
        
        let result = query.fetch_optional(self.db.pool())
            .await
            .map_err(|e| AppError::Database(e))?;
            
        if let Some(row) = result {
            self.map_row_to_user(row)
        } else {
            Err(AppError::NotFound("User not found".to_string()))
        }
    }

    async fn update(&self, id: String, user: &User) -> AppResult<User> {
        let now = Utc::now();
        
        let query = sqlx::query(
            "UPDATE users 
             SET email = $2, first_name = $3, last_name = $4, profile_image_url = $5, updated_at = $6
             WHERE id = $1
             RETURNING *"
        )
        .bind(id)
        .bind(&user.email)
        .bind(&user.first_name)
        .bind(&user.last_name)
        .bind(&user.profile_image_url)
        .bind(now);
        
        let row = query.fetch_one(self.db.pool())
            .await
            .map_err(|e| AppError::Database(e))?;
            
        self.map_row_to_user(row)
    }

    async fn delete(&self, id: String) -> AppResult<()> {
        let query = sqlx::query(
            "DELETE FROM users WHERE id = $1"
        )
        .bind(id);
        
        query.execute(self.db.pool())
            .await
            .map_err(|e| AppError::Database(e))?;
            
        Ok(())
    }

    async fn get_all(&self) -> AppResult<Vec<User>> {
        let query = sqlx::query(
            "SELECT * FROM users ORDER BY created_at DESC"
        );
        
        let rows = query.fetch_all(self.db.pool())
            .await
            .map_err(|e| AppError::Database(e))?;
            
        let mut users = Vec::with_capacity(rows.len());
        for row in rows {
            users.push(self.map_row_to_user(row)?);
        }
        
        Ok(users)
    }
}