-- Add additional fields to campaigns table for brand campaign creation
ALTER TABLE campaigns 
ADD COLUMN budget TEXT,
ADD COLUMN image_url TEXT,
ADD COLUMN timeline TEXT DEFAULT 'Flexible',
ADD COLUMN objectives TEXT[] DEFAULT '{}',
ADD COLUMN estimated_views INTEGER DEFAULT 0,
ADD COLUMN quality_standard TEXT DEFAULT 'premium' CHECK (quality_standard IN ('basic', 'premium', 'professional'));

-- Create brand_profiles table for additional brand information
CREATE TABLE brand_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    email TEXT,
    company_description TEXT,
    website_url TEXT,
    logo_url TEXT,
    industry TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for brand_profiles
CREATE INDEX idx_brand_profiles_user_id ON brand_profiles(user_id);

-- Enable RLS for brand_profiles
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brand_profiles
CREATE POLICY "Brands can view own profile" ON brand_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Brands can insert own profile" ON brand_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Brands can update own profile" ON brand_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Add trigger to update updated_at on brand_profiles
CREATE TRIGGER update_brand_profiles_updated_at 
    BEFORE UPDATE ON brand_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view for campaign analytics (optional but useful)
CREATE VIEW campaign_analytics AS
SELECT 
    c.id,
    c.name,
    c.status,
    c.budget,
    c.payout,
    c.created_at,
    c.created_by,
    COUNT(cs.id) as total_submissions,
    COUNT(CASE WHEN cs.status = 'approved' THEN 1 END) as approved_submissions,
    COUNT(CASE WHEN cs.status = 'pending' THEN 1 END) as pending_submissions,
    COUNT(CASE WHEN cs.status = 'rejected' THEN 1 END) as rejected_submissions
FROM campaigns c
LEFT JOIN campaign_submissions cs ON c.id = cs.campaign_id
GROUP BY c.id, c.name, c.status, c.budget, c.payout, c.created_at, c.created_by;

-- Update the existing campaigns table query to include submission counts
-- (This is what the dashboard will use)

-- Sample brand profile data
INSERT INTO brand_profiles (user_id, brand_name, email, company_description, industry) VALUES 
(
    (SELECT id FROM auth.users LIMIT 1), -- Replace with actual brand user ID
    'Fashion Forward Co.',
    'sarah@fashionforward.com',
    'A modern fashion brand focused on sustainable and trendy clothing for young professionals.',
    'Fashion & Apparel'
);

-- Create storage bucket for campaign assets (run this in Supabase dashboard)
-- Go to Storage > Create Bucket > Name: 'campaign-assets' > Public: true

-- Update sample campaigns to include new fields
UPDATE campaigns SET 
    budget = '$5000',
    payout = '$500',
    image_url = '/images/campaign-placeholder.jpg',
    timeline = '1 month',
    objectives = ARRAY['Increase Brand Awareness', 'Drive Sales'],
    estimated_views = 1000000,
    quality_standard = 'premium'
WHERE name = 'Brand Campaign for Summer Collection';