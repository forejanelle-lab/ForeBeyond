-- Fore Beyond — complete database setup
-- Paste into Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/pudfethylijrfilcihgp/sql/new


-- Fore Beyond Phase 1 Database Schema
-- Migration: 001_initial_schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE user_role AS ENUM ('traveler', 'host', 'both');
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'in_review', 'verified', 'rejected');
CREATE TYPE onboarding_step AS ENUM ('profile', 'preferences', 'verification', 'complete');
CREATE TYPE document_type AS ENUM ('government_id', 'selfie', 'address_proof', 'background_check');
CREATE TYPE badge_type AS ENUM ('identity_verified', 'background_checked', 'community_vouched', 'experienced_host', 'experienced_traveler');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role user_role,
  phone TEXT,
  location TEXT,
  languages TEXT[] DEFAULT '{}',
  onboarding_step onboarding_step DEFAULT 'profile',
  onboarding_complete BOOLEAN DEFAULT FALSE,
  verification_status verification_status DEFAULT 'unverified',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Traveler profiles
CREATE TABLE traveler_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  interests TEXT[] DEFAULT '{}',
  travel_style TEXT,
  dietary_preferences TEXT[] DEFAULT '{}',
  accessibility_needs TEXT,
  preferred_destinations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Host profiles
CREATE TABLE host_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  household_description TEXT,
  cultural_offerings TEXT[] DEFAULT '{}',
  languages_spoken TEXT[] DEFAULT '{}',
  max_guests INTEGER DEFAULT 1,
  experience_description TEXT,
  neighborhood TEXT,
  city TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Verification documents
CREATE TABLE verification_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_url TEXT,
  status verification_status DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trust badges
CREATE TABLE trust_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type badge_type NOT NULL,
  awarded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, badge_type)
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_traveler_profiles_updated_at
  BEFORE UPDATE ON traveler_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_host_profiles_updated_at
  BEFORE UPDATE ON host_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_documents_updated_at
  BEFORE UPDATE ON verification_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', ''),
    NULLIF(TRIM(CONCAT(
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      ' ',
      COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    )), '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX idx_traveler_profiles_user_id ON traveler_profiles(user_id);
CREATE INDEX idx_host_profiles_user_id ON host_profiles(user_id);
CREATE INDEX idx_verification_documents_user_id ON verification_documents(user_id);
CREATE INDEX idx_verification_documents_status ON verification_documents(status);
CREATE INDEX idx_trust_badges_user_id ON trust_badges(user_id);
-- Fore Beyond Phase 1 Row Level Security Policies
-- Migration: 002_rls_policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE traveler_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_badges ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated' AND onboarding_complete = TRUE);

-- Traveler profiles policies
CREATE POLICY "Users can view their own traveler profile"
  ON traveler_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own traveler profile"
  ON traveler_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own traveler profile"
  ON traveler_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view completed traveler profiles"
  ON traveler_profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Host profiles policies
CREATE POLICY "Users can view their own host profile"
  ON host_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own host profile"
  ON host_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own host profile"
  ON host_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view host profiles"
  ON host_profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Verification documents policies
CREATE POLICY "Users can view their own verification documents"
  ON verification_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification documents"
  ON verification_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending verification documents"
  ON verification_documents FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('unverified', 'pending'));

-- Trust badges policies
CREATE POLICY "Anyone authenticated can view trust badges"
  ON trust_badges FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view their own trust badges"
  ON trust_badges FOR SELECT
  USING (auth.uid() = user_id);
