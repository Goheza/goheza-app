-- Social Accounts (one row per connected platform per user)
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram')),  -- extensible
  external_user_id TEXT NOT NULL,          -- TikTok: open_id | Instagram: instagram_business_id
  access_token TEXT NOT NULL,
  refresh_token TEXT,                      -- TikTok has it; Instagram uses long-lived
  expires_at TIMESTAMP,
  extra_data JSONB,                        -- platform-specific: e.g. {page_id: "..."} for IG
  connected_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Campaigns (unchanged)
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Posted Content (unified for TikTok/Instagram)
CREATE TABLE campaign_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id),
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram')),
  media_id TEXT NOT NULL,                  -- TikTok: video_id / publish_id | Instagram: media_id
  permalink TEXT,                          -- TikTok: share link | Instagram: permalink
  video_url TEXT,
  thumbnail_url TEXT,
  media_type TEXT,                         -- e.g. 'VIDEO', 'REELS', 'DIRECT_POST'
  status TEXT DEFAULT 'PROCESSING',        -- PROCESSING, PUBLISHED, FAILED
  posted_at TIMESTAMP DEFAULT NOW()
);

-- Insights (per media item, aggregated later if needed)
CREATE TABLE campaign_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id),
  platform TEXT NOT NULL,
  media_id TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,                 -- TikTok: views | IG: plays/views
  shares INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,                 -- IG strong; TikTok limited
  impressions INTEGER DEFAULT 0,           -- IG strong; TikTok limited
  saves INTEGER DEFAULT 0,                 -- IG only mostly
  extra_metrics JSONB,                     -- platform-specific e.g. {"skip_rate": 12.5} for IG Reels
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(campaign_id, platform, media_id)
);