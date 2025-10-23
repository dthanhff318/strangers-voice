-- Create follows table for user follow relationships
-- Approach: Unidirectional - 1 follow action = 1 record
-- If User A and User B follow each other = 2 records

create table follows (
  id uuid default uuid_generate_v4() primary key,
  follower_id uuid references profiles(id) on delete cascade not null,
  following_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Prevent duplicate follows: a user can only follow another user once
  unique(follower_id, following_id),

  -- Prevent self-following: a user cannot follow themselves
  constraint no_self_follow check (follower_id != following_id)
);

-- Create indexes for optimal query performance

-- Index 1: Find "who is User A following?"
-- Query: SELECT * FROM follows WHERE follower_id = 'user-A-id'
create index idx_follows_follower on follows(follower_id);

-- Index 2: Find "who is following User B?"
-- Query: SELECT * FROM follows WHERE following_id = 'user-B-id'
create index idx_follows_following on follows(following_id);

-- Index 3: Sort by follow time
-- Query: SELECT * FROM follows ORDER BY created_at DESC
create index idx_follows_created_at on follows(created_at desc);

-- Composite index for checking follow status (most common query)
-- Query: SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?)
create index idx_follows_relationship on follows(follower_id, following_id);

-- Enable Row Level Security
alter table follows enable row level security;

-- RLS Policy 1: Anyone can view follows (public information)
create policy "Follows are viewable by everyone"
  on follows for select
  using (true);

-- RLS Policy 2: Users can follow others (authenticated users only)
create policy "Users can follow others"
  on follows for insert
  with check (auth.uid() = follower_id);

-- RLS Policy 3: Users can unfollow (delete their own follows only)
create policy "Users can unfollow"
  on follows for delete
  using (auth.uid() = follower_id);

-- Add comment to table
comment on table follows is 'Stores user follow relationships. Each follow is a separate record (unidirectional). If A follows B and B follows A, there will be 2 records.';
comment on column follows.follower_id is 'The user who is following (the follower)';
comment on column follows.following_id is 'The user being followed (the followee)';
