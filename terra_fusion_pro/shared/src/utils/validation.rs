use regex::Regex;
use crate::error::{AppError, AppResult};

/// Validate an email address
pub fn validate_email(email: &str) -> bool {
    let email_regex = Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").unwrap();
    email_regex.is_match(email)
}

/// Validate a US phone number
pub fn validate_phone(phone: &str) -> bool {
    let phone_regex = Regex::new(r"^\+?1?\s*\(?[2-9][0-9]{2}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$").unwrap();
    phone_regex.is_match(phone)
}

/// Validate a US zip code
pub fn validate_zip_code(zip: &str) -> bool {
    let zip_regex = Regex::new(r"^\d{5}(-\d{4})?$").unwrap();
    zip_regex.is_match(zip)
}

/// Validate a password meets minimum requirements
pub fn validate_password(password: &str) -> AppResult<()> {
    if password.len() < 8 {
        return Err(AppError::Validation("Password must be at least 8 characters long".to_string()));
    }
    
    let has_uppercase = password.chars().any(|c| c.is_uppercase());
    let has_lowercase = password.chars().any(|c| c.is_lowercase());
    let has_digit = password.chars().any(|c| c.is_digit(10));
    let has_special = password.chars().any(|c| !c.is_alphanumeric());
    
    if !has_uppercase || !has_lowercase || !has_digit || !has_special {
        return Err(AppError::Validation(
            "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character".to_string()
        ));
    }
    
    Ok(())
}

/// Validate a URL
pub fn validate_url(url: &str) -> bool {
    let url_regex = Regex::new(r"^(https?|ftp)://[^\s/$.?#].[^\s]*$").unwrap();
    url_regex.is_match(url)
}

/// Validate a year is within a reasonable range
pub fn validate_year(year: i32) -> bool {
    year >= 1800 && year <= 2100
}

/// Validate a latitude value
pub fn validate_latitude(lat: f64) -> bool {
    lat >= -90.0 && lat <= 90.0
}

/// Validate a longitude value
pub fn validate_longitude(lng: f64) -> bool {
    lng >= -180.0 && lng <= 180.0
}

/// Validate a price value is reasonable
pub fn validate_price(price: f64) -> bool {
    price >= 0.0 && price <= 1_000_000_000.0
}

/// Sanitize user input to prevent injection attacks
pub fn sanitize_input(input: &str) -> String {
    input
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('\"', "&quot;")
        .replace('\'', "&#39;")
        .replace('&', "&amp;")
}