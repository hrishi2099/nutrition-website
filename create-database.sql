-- Create database for NutriSap application
-- Run this in your MySQL server if the database doesn't exist

CREATE DATABASE IF NOT EXISTS nutrition_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Create a user (optional - you can use root)
-- CREATE USER 'nutrition_user'@'localhost' IDENTIFIED BY 'secure_password';
-- GRANT ALL PRIVILEGES ON nutrition_db.* TO 'nutrition_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Show databases to verify
SHOW DATABASES;