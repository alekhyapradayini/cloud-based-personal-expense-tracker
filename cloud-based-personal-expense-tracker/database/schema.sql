-- ==========================================
-- AWS RDS MySQL SCHEMA DEFINITIONS
-- PROJECT: Cloud-Based Personal Expense Tracker
-- AUTHOR: AWS Cloud & DevOps Senior Engineer
-- DATE: 2026-07-20
-- ==========================================

-- Create Database if not exists (for local testing / bootstrap)
CREATE DATABASE IF NOT EXISTS personal_expenses;
USE personal_expenses;

-- ==========================================
-- 1. USERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 2. CATEGORIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) DEFAULT 'HelpCircle',
  color VARCHAR(10) DEFAULT '#3b82f6',
  is_custom BOOLEAN DEFAULT FALSE,
  user_id VARCHAR(50) DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_cat_name (name, user_id),
  INDEX idx_cat_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 3. EXPENSES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  category_id VARCHAR(50) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  description VARCHAR(255) DEFAULT '',
  date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  INDEX idx_expense_user_date (user_id, date),
  INDEX idx_expense_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 4. INSERT DEFAULT SEED CATEGORIES
-- ==========================================
INSERT INTO categories (id, name, icon, color, is_custom) VALUES
('cat-1', 'Food', 'Utensils', '#f59e0b', FALSE),
('cat-2', 'Travel', 'MapPin', '#3b82f6', FALSE),
('cat-3', 'Shopping', 'ShoppingBag', '#ec4899', FALSE),
('cat-4', 'Bills', 'CreditCard', '#ef4444', FALSE),
('cat-5', 'Medical', 'Activity', '#10b981', FALSE),
('cat-6', 'Entertainment', 'Tv', '#6366f1', FALSE),
('cat-7', 'Education', 'BookOpen', '#14b8a6', FALSE),
('cat-8', 'Investment', 'TrendingUp', '#10b981', FALSE),
('cat-9', 'Others', 'HelpCircle', '#6b7280', FALSE)
ON DUPLICATE KEY UPDATE name=VALUES(name);
