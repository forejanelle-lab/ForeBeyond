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
