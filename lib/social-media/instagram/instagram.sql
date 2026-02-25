CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  platform TEXT DEFAULT 'instagram',
  instagram_business_id TEXT NOT NULL,     -- IG User ID (from Graph API)
  facebook_page_id TEXT,                    -- Linked FB Page (needed sometimes)
  access_token TEXT NOT NULL,               -- Long-lived user token
  expires_at TIMESTAMP,
  connected_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE campaign_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id),
  platform TEXT DEFAULT 'instagram',
  media_id TEXT NOT NULL,                   -- Instagram media/container ID
  permalink TEXT,                           -- Public link
  thumbnail_url TEXT,
  media_product_type TEXT,                  -- FEED, REELS, STORY
  posted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE campaign_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id),
  media_id TEXT,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,                  -- plays for Reels
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);