-- Initial database schema for tan-chirper
-- Migration: 001_initial_schema
-- Uses UUIDv7 for chronologically sortable primary keys

-- Enable UUID extension for UUIDv7 support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table - User profiles and authentication
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    bio TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chirps table - User posts with 141 character limit
CREATE TABLE chirps (
    id UUID PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) <= 141 AND length(content) > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes table - User likes on chirps
CREATE TABLE likes (
    id UUID PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    chirp_id UUID NOT NULL REFERENCES chirps(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can only like a chirp once
    UNIQUE(profile_id, chirp_id)
);

-- Indexes for performance
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_chirps_profile_id ON chirps(profile_id);
CREATE INDEX idx_chirps_created_at ON chirps(created_at DESC);
CREATE INDEX idx_likes_profile_id ON likes(profile_id);
CREATE INDEX idx_likes_chirp_id ON likes(chirp_id);
CREATE INDEX idx_likes_created_at ON likes(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chirps_updated_at 
    BEFORE UPDATE ON chirps 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();