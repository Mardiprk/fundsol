-- Table: campaigns
CREATE TABLE campaigns (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    goal_amount INTEGER NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    end_date TEXT NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    wallet_address TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    summary TEXT
);

-- Indexes for campaigns
CREATE UNIQUE INDEX sqlite_autoindex_campaigns_1 ON campaigns(id);
CREATE UNIQUE INDEX sqlite_autoindex_campaigns_2 ON campaigns(slug);

-- Table: donations
CREATE TABLE donations (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    donor_id TEXT,
    amount INTEGER NOT NULL,
    transaction_signature TEXT NOT NULL,
    created_at TEXT NOT NULL,
    CONSTRAINT donations_campaign_id_campaigns_id_fk
        FOREIGN KEY (campaign_id)
        REFERENCES campaigns(id)
);

-- Indexes for donations
CREATE UNIQUE INDEX sqlite_autoindex_donations_1 ON donations(id);

-- Table: favorites
CREATE TABLE favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    campaign_id TEXT NOT NULL,
    created_at NUMERIC DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT favorites_user_id_campaign_id_uk
        UNIQUE (user_id, campaign_id),
    CONSTRAINT favorites_user_id_users_id_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
);

-- Indexes for favorites
CREATE UNIQUE INDEX sqlite_autoindex_favorites_1 ON favorites(user_id, campaign_id);

-- Table: users
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    name TEXT,
    profile_completed NUMERIC DEFAULT 0
);

-- Indexes for users
CREATE UNIQUE INDEX sqlite_autoindex_users_1 ON users(id);
CREATE UNIQUE INDEX sqlite_autoindex_users_2 ON users(wallet_address);