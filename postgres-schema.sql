-- PostgreSQL Schema for Visitor Counter Application
-- This replaces the Supabase schema with standard PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabel untuk website yang dipantau
CREATE TABLE IF NOT EXISTS websites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL UNIQUE,
  tracking_id VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel untuk users (menggantikan Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Tabel untuk data visitor
CREATE TABLE IF NOT EXISTS visitors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  page_url TEXT,
  page_title TEXT,
  visit_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds INTEGER DEFAULT 0,
  is_fake BOOLEAN DEFAULT FALSE,
  country VARCHAR(2),
  city VARCHAR(100),
  browser VARCHAR(50),
  os VARCHAR(50),
  device_type VARCHAR(20)
);

-- Tabel untuk statistik harian
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  average_duration_seconds INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(website_id, date)
);

-- Function untuk update daily stats
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_stats (website_id, date, page_views, unique_visitors, total_sessions, average_duration_seconds)
  VALUES 
    (NEW.website_id, NEW.visit_time::date, 1, 1, 1, NEW.duration_seconds)
  ON CONFLICT (website_id, date) DO UPDATE SET
    page_views = daily_stats.page_views + 1,
    unique_visitors = (
      SELECT COUNT(DISTINCT session_id) 
      FROM visitors 
      WHERE website_id = NEW.website_id AND visit_time::date = NEW.visit_time::date
    ),
    total_sessions = daily_stats.total_sessions + 1,
    average_duration_seconds = (
      SELECT AVG(duration_seconds) 
      FROM visitors 
      WHERE website_id = NEW.website_id AND visit_time::date = NEW.visit_time::date
    ),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk otomatis update stats
DROP TRIGGER IF EXISTS trigger_update_daily_stats ON visitors;
CREATE TRIGGER trigger_update_daily_stats
AFTER INSERT ON visitors
FOR EACH ROW
EXECUTE FUNCTION update_daily_stats();

-- Function untuk update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers untuk updated_at
DROP TRIGGER IF EXISTS update_websites_updated_at ON websites;
CREATE TRIGGER update_websites_updated_at
    BEFORE UPDATE ON websites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visitors_website_id ON visitors(website_id);
CREATE INDEX IF NOT EXISTS idx_visitors_session_id ON visitors(session_id);
CREATE INDEX IF NOT EXISTS idx_visitors_visit_time ON visitors(visit_time);
CREATE INDEX IF NOT EXISTS idx_visitors_website_visit_time ON visitors(website_id, visit_time);
CREATE INDEX IF NOT EXISTS idx_websites_tracking_id ON websites(tracking_id);
CREATE INDEX IF NOT EXISTS idx_websites_domain ON websites(domain);
CREATE INDEX IF NOT EXISTS idx_daily_stats_website_date ON daily_stats(website_id, date);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, name, role) 
VALUES (
  'admin@visitor-counter.com', 
  '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 
  'Admin User', 
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample website for testing
INSERT INTO websites (name, domain, tracking_id, is_active)
VALUES (
  'Example Website',
  'example.com',
  'EXAMPLE123',
  true
) ON CONFLICT (domain) DO NOTHING;