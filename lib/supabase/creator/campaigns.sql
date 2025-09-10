-- Create campaigns table
CREATE TABLE campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    requirements TEXT[] NOT NULL DEFAULT '{}',
    payout TEXT NOT NULL,
    assets JSONB DEFAULT '[]',
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create campaign_submissions table
CREATE TABLE campaign_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    campaign_name TEXT NOT NULL,
    video_url TEXT NOT NULL,
    caption TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    review_notes TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX idx_campaign_submissions_user_id ON campaign_submissions(user_id);
CREATE INDEX idx_campaign_submissions_campaign_id ON campaign_submissions(campaign_id);
CREATE INDEX idx_campaign_submissions_status ON campaign_submissions(status);
CREATE INDEX idx_campaign_submissions_submitted_at ON campaign_submissions(submitted_at);

-- Enable Row Level Security
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaigns table
-- Anyone can view active campaigns
CREATE POLICY "Anyone can view active campaigns" ON campaigns
    FOR SELECT USING (status = 'active');

-- Only campaign creators can insert/update their campaigns
CREATE POLICY "Users can insert own campaigns" ON campaigns
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own campaigns" ON campaigns
    FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for campaign_submissions table
-- Users can insert their own submissions
CREATE POLICY "Users can insert own submissions" ON campaign_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions" ON campaign_submissions
    FOR SELECT USING (auth.uid() = user_id);

-- Campaign creators can view submissions for their campaigns
CREATE POLICY "Campaign creators can view submissions" ON campaign_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM campaigns 
            WHERE campaigns.id = campaign_submissions.campaign_id 
            AND campaigns.created_by = auth.uid()
        )
    );

-- Campaign creators can update submissions for their campaigns (for review)
CREATE POLICY "Campaign creators can update submissions" ON campaign_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM campaigns 
            WHERE campaigns.id = campaign_submissions.campaign_id 
            AND campaigns.created_by = auth.uid()
        )
    );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to update updated_at on campaigns table
CREATE TRIGGER update_campaigns_updated_at 
    BEFORE UPDATE ON campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample campaign data
INSERT INTO campaigns (name, requirements, payout, assets, description, created_by) VALUES 
(
    'Brand Campaign for Summer Collection',
    ARRAY[
        'Create a 30-second video showcasing the Summer Collection.',
        'Highlight the versatility and style of the clothing.',
        'Use natural lighting and outdoor settings.',
        'Include a call to action to visit the brand''s website.'
    ],
    '$500',
    '[
        {"name": "Brand Guidelines", "imageSource": "/images/document-icon.png"},
        {"name": "Logo Files", "imageSource": "/images/document-icon.png"},
        {"name": "Example Content", "imageSource": "/images/document-icon.png"}
    ]'::jsonb,
    'A summer campaign to showcase our latest clothing collection with authentic, outdoor content.',
    (SELECT id FROM auth.users LIMIT 1) -- Replace with actual user ID
);

ALTER TABLE campaigns 
ADD COLUMN image_url TEXT,
ADD COLUMN timeline TEXT DEFAULT 'Flexible';