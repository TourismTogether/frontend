/*
  # AdventureMate Database Schema

  ## Overview
  Complete database schema for AdventureMate - a travel companion platform for backpackers and adventure travelers.

  ## New Tables

  ### 1. profiles
  - `id` (uuid, primary key, references auth.users)
  - `username` (text, unique)
  - `full_name` (text)
  - `bio` (text)
  - `avatar_url` (text)
  - `location` (text)
  - `travel_preferences` (jsonb) - stores interests, budget preferences, travel style
  - `experience_level` (text) - beginner, intermediate, expert
  - `points` (integer) - for reward system
  - `rank` (text) - bronze, silver, gold, platinum
  - `badges` (jsonb) - array of earned badges
  - `is_location_shared` (boolean)
  - `current_latitude` (numeric)
  - `current_longitude` (numeric)
  - `emergency_contacts` (jsonb)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. routes
  - `id` (uuid, primary key)
  - `creator_id` (uuid, references profiles)
  - `title` (text)
  - `description` (text)
  - `difficulty` (text) - easy, moderate, hard, extreme
  - `duration_days` (integer)
  - `distance_km` (numeric)
  - `start_location` (text)
  - `end_location` (text)
  - `route_data` (jsonb) - stores waypoints, coordinates
  - `tags` (text[])
  - `is_public` (boolean)
  - `average_rating` (numeric)
  - `total_ratings` (integer)
  - `view_count` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. route_stopovers
  - `id` (uuid, primary key)
  - `route_id` (uuid, references routes)
  - `order_index` (integer)
  - `location_name` (text)
  - `latitude` (numeric)
  - `longitude` (numeric)
  - `description` (text)
  - `estimated_duration_hours` (numeric)
  - `created_at` (timestamptz)

  ### 4. destinations
  - `id` (uuid, primary key)
  - `name` (text)
  - `country` (text)
  - `region` (text)
  - `description` (text)
  - `latitude` (numeric)
  - `longitude` (numeric)
  - `category` (text) - mountain, beach, city, desert, forest, etc.
  - `best_season` (text[])
  - `average_cost_per_day` (numeric)
  - `safety_rating` (integer)
  - `average_rating` (numeric)
  - `total_reviews` (integer)
  - `images` (jsonb)
  - `amenities` (text[])
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. destination_reviews
  - `id` (uuid, primary key)
  - `destination_id` (uuid, references destinations)
  - `user_id` (uuid, references profiles)
  - `rating` (integer) - 1-5
  - `title` (text)
  - `review_text` (text)
  - `images` (jsonb)
  - `visit_date` (date)
  - `helpful_count` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. travel_groups
  - `id` (uuid, primary key)
  - `creator_id` (uuid, references profiles)
  - `name` (text)
  - `description` (text)
  - `group_type` (text) - public, private, invite-only
  - `max_members` (integer)
  - `current_members_count` (integer)
  - `destination` (text)
  - `start_date` (date)
  - `end_date` (date)
  - `tags` (text[])
  - `image_url` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 7. group_members
  - `id` (uuid, primary key)
  - `group_id` (uuid, references travel_groups)
  - `user_id` (uuid, references profiles)
  - `role` (text) - admin, moderator, member
  - `status` (text) - pending, active, left
  - `joined_at` (timestamptz)

  ### 8. trips
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `route_id` (uuid, references routes, nullable)
  - `group_id` (uuid, references travel_groups, nullable)
  - `title` (text)
  - `description` (text)
  - `start_date` (date)
  - `end_date` (date)
  - `status` (text) - planning, ongoing, completed, cancelled
  - `total_budget` (numeric)
  - `spent_amount` (numeric)
  - `currency` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 9. trip_expenses
  - `id` (uuid, primary key)
  - `trip_id` (uuid, references trips)
  - `user_id` (uuid, references profiles)
  - `category` (text) - accommodation, food, transport, activities, other
  - `description` (text)
  - `amount` (numeric)
  - `currency` (text)
  - `date` (date)
  - `split_with` (uuid[]) - array of user ids
  - `receipt_url` (text)
  - `created_at` (timestamptz)

  ### 10. trip_journals
  - `id` (uuid, primary key)
  - `trip_id` (uuid, references trips)
  - `user_id` (uuid, references profiles)
  - `title` (text)
  - `content` (text)
  - `location` (text)
  - `latitude` (numeric)
  - `longitude` (numeric)
  - `media` (jsonb) - photos and videos
  - `mood` (text)
  - `weather` (text)
  - `is_public` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 11. route_ratings
  - `id` (uuid, primary key)
  - `route_id` (uuid, references routes)
  - `user_id` (uuid, references profiles)
  - `rating` (integer) - 1-5
  - `comment` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 12. forum_categories
  - `id` (uuid, primary key)
  - `name` (text)
  - `description` (text)
  - `icon` (text)
  - `color` (text)
  - `order_index` (integer)
  - `created_at` (timestamptz)

  ### 13. forum_posts
  - `id` (uuid, primary key)
  - `category_id` (uuid, references forum_categories)
  - `user_id` (uuid, references profiles)
  - `title` (text)
  - `content` (text)
  - `tags` (text[])
  - `is_pinned` (boolean)
  - `view_count` (integer)
  - `reply_count` (integer)
  - `last_activity_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 14. forum_replies
  - `id` (uuid, primary key)
  - `post_id` (uuid, references forum_posts)
  - `user_id` (uuid, references profiles)
  - `content` (text)
  - `parent_reply_id` (uuid, references forum_replies, nullable)
  - `helpful_count` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 15. notifications
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `type` (text) - group_invite, trip_update, new_follower, etc.
  - `title` (text)
  - `message` (text)
  - `link` (text)
  - `is_read` (boolean)
  - `created_at` (timestamptz)

  ### 16. user_achievements
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `achievement_type` (text)
  - `achievement_name` (text)
  - `description` (text)
  - `icon` (text)
  - `points_earned` (integer)
  - `earned_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their own data
  - Add policies for public read access where appropriate
  - Implement proper ownership and membership checks
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  bio text,
  avatar_url text,
  location text,
  travel_preferences jsonb DEFAULT '{}'::jsonb,
  experience_level text DEFAULT 'beginner',
  points integer DEFAULT 0,
  rank text DEFAULT 'bronze',
  badges jsonb DEFAULT '[]'::jsonb,
  is_location_shared boolean DEFAULT false,
  current_latitude numeric,
  current_longitude numeric,
  emergency_contacts jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create routes table
CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  difficulty text DEFAULT 'moderate',
  duration_days integer,
  distance_km numeric,
  start_location text,
  end_location text,
  route_data jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT ARRAY[]::text[],
  is_public boolean DEFAULT true,
  average_rating numeric DEFAULT 0,
  total_ratings integer DEFAULT 0,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create route_stopovers table
CREATE TABLE IF NOT EXISTS route_stopovers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  order_index integer NOT NULL,
  location_name text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  description text,
  estimated_duration_hours numeric,
  created_at timestamptz DEFAULT now()
);

-- Create destinations table
CREATE TABLE IF NOT EXISTS destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL,
  region text,
  description text,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  category text,
  best_season text[] DEFAULT ARRAY[]::text[],
  average_cost_per_day numeric,
  safety_rating integer DEFAULT 3,
  average_rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  images jsonb DEFAULT '[]'::jsonb,
  amenities text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create destination_reviews table
CREATE TABLE IF NOT EXISTS destination_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id uuid REFERENCES destinations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  review_text text,
  images jsonb DEFAULT '[]'::jsonb,
  visit_date date,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create travel_groups table
CREATE TABLE IF NOT EXISTS travel_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  group_type text DEFAULT 'public',
  max_members integer DEFAULT 10,
  current_members_count integer DEFAULT 1,
  destination text,
  start_date date,
  end_date date,
  tags text[] DEFAULT ARRAY[]::text[],
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES travel_groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member',
  status text DEFAULT 'active',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  route_id uuid REFERENCES routes(id) ON DELETE SET NULL,
  group_id uuid REFERENCES travel_groups(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  start_date date,
  end_date date,
  status text DEFAULT 'planning',
  total_budget numeric DEFAULT 0,
  spent_amount numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create trip_expenses table
CREATE TABLE IF NOT EXISTS trip_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  description text,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  date date DEFAULT CURRENT_DATE,
  split_with uuid[] DEFAULT ARRAY[]::uuid[],
  receipt_url text,
  created_at timestamptz DEFAULT now()
);

-- Create trip_journals table
CREATE TABLE IF NOT EXISTS trip_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text,
  location text,
  latitude numeric,
  longitude numeric,
  media jsonb DEFAULT '[]'::jsonb,
  mood text,
  weather text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create route_ratings table
CREATE TABLE IF NOT EXISTS route_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(route_id, user_id)
);

-- Create forum_categories table
CREATE TABLE IF NOT EXISTS forum_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  color text DEFAULT '#22c55e',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create forum_posts table
CREATE TABLE IF NOT EXISTS forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES forum_categories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT ARRAY[]::text[],
  is_pinned boolean DEFAULT false,
  view_count integer DEFAULT 0,
  reply_count integer DEFAULT 0,
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create forum_replies table
CREATE TABLE IF NOT EXISTS forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES forum_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  parent_reply_id uuid REFERENCES forum_replies(id) ON DELETE CASCADE,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_type text NOT NULL,
  achievement_name text NOT NULL,
  description text,
  icon text,
  points_earned integer DEFAULT 0,
  earned_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stopovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE destination_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Routes policies
CREATE POLICY "Public routes are viewable by everyone"
  ON routes FOR SELECT
  TO authenticated
  USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can create routes"
  ON routes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update own routes"
  ON routes FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can delete own routes"
  ON routes FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Route stopovers policies
CREATE POLICY "Route stopovers viewable with route"
  ON route_stopovers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = route_stopovers.route_id
      AND (routes.is_public = true OR routes.creator_id = auth.uid())
    )
  );

CREATE POLICY "Users can add stopovers to own routes"
  ON route_stopovers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = route_stopovers.route_id
      AND routes.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can update stopovers on own routes"
  ON route_stopovers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = route_stopovers.route_id
      AND routes.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = route_stopovers.route_id
      AND routes.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete stopovers from own routes"
  ON route_stopovers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = route_stopovers.route_id
      AND routes.creator_id = auth.uid()
    )
  );

-- Destinations policies
CREATE POLICY "Destinations are viewable by everyone"
  ON destinations FOR SELECT
  TO authenticated
  USING (true);

-- Destination reviews policies
CREATE POLICY "Reviews are viewable by everyone"
  ON destination_reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create reviews"
  ON destination_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON destination_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON destination_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Travel groups policies
CREATE POLICY "Public groups viewable by everyone"
  ON travel_groups FOR SELECT
  TO authenticated
  USING (
    group_type = 'public' OR
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = travel_groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.status = 'active'
    )
  );

CREATE POLICY "Users can create travel groups"
  ON travel_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own groups"
  ON travel_groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own groups"
  ON travel_groups FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Group members policies
CREATE POLICY "Group members viewable by group members"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM travel_groups
      WHERE travel_groups.id = group_members.group_id
      AND (
        travel_groups.group_type = 'public' OR
        travel_groups.creator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM group_members gm2
          WHERE gm2.group_id = travel_groups.id
          AND gm2.user_id = auth.uid()
          AND gm2.status = 'active'
        )
      )
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own membership"
  ON group_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trips policies
CREATE POLICY "Users can view own trips"
  ON trips FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create trips"
  ON trips FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
  ON trips FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
  ON trips FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trip expenses policies
CREATE POLICY "Users can view expenses for own trips"
  ON trip_expenses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_expenses.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add expenses to own trips"
  ON trip_expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_expenses.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own expenses"
  ON trip_expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON trip_expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trip journals policies
CREATE POLICY "Public journals viewable by everyone"
  ON trip_journals FOR SELECT
  TO authenticated
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can create journal entries"
  ON trip_journals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journals"
  ON trip_journals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journals"
  ON trip_journals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Route ratings policies
CREATE POLICY "Route ratings viewable by everyone"
  ON route_ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can rate routes"
  ON route_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
  ON route_ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
  ON route_ratings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Forum categories policies
CREATE POLICY "Forum categories viewable by everyone"
  ON forum_categories FOR SELECT
  TO authenticated
  USING (true);

-- Forum posts policies
CREATE POLICY "Forum posts viewable by everyone"
  ON forum_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create forum posts"
  ON forum_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON forum_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON forum_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Forum replies policies
CREATE POLICY "Forum replies viewable by everyone"
  ON forum_replies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create replies"
  ON forum_replies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own replies"
  ON forum_replies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own replies"
  ON forum_replies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User achievements policies
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_routes_creator ON routes(creator_id);
CREATE INDEX IF NOT EXISTS idx_routes_public ON routes(is_public);
CREATE INDEX IF NOT EXISTS idx_route_stopovers_route ON route_stopovers(route_id);
CREATE INDEX IF NOT EXISTS idx_destination_reviews_destination ON destination_reviews(destination_id);
CREATE INDEX IF NOT EXISTS idx_destination_reviews_user ON destination_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_groups_creator ON travel_groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_user ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_trip ON trip_expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_journals_trip ON trip_journals(trip_id);
CREATE INDEX IF NOT EXISTS idx_route_ratings_route ON route_ratings(route_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_post ON forum_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);