CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  total_steps INTEGER NOT NULL,
  completed_steps INTEGER NOT NULL DEFAULT 0,
  final_reward TEXT,
  theme TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

CREATE TABLE IF NOT EXISTS stickers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  theme TEXT,
  image_url TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'normal',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stickers_theme ON stickers(theme);

CREATE TABLE IF NOT EXISTS goal_slots (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL,
  slot_index INTEGER NOT NULL,
  sticker_id TEXT,
  completion_id TEXT,
  status TEXT NOT NULL DEFAULT 'empty',
  created_at TEXT NOT NULL,
  filled_at TEXT,
  UNIQUE(goal_id, slot_index)
);

CREATE INDEX IF NOT EXISTS idx_goal_slots_goal_id ON goal_slots(goal_id);

CREATE TABLE IF NOT EXISTS completions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  goal_id TEXT NOT NULL,
  slot_id TEXT NOT NULL,
  sticker_id TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_completions_goal_id ON completions(goal_id);
CREATE INDEX IF NOT EXISTS idx_completions_user_id ON completions(user_id);

CREATE TABLE IF NOT EXISTS rewards (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL,
  title TEXT NOT NULL,
  trigger_step INTEGER NOT NULL,
  is_claimed INTEGER NOT NULL DEFAULT 0,
  claimed_at TEXT,
  created_at TEXT NOT NULL
);
