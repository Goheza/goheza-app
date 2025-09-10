

CREATE TABLE public.admin_users (
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_users_pkey PRIMARY KEY (user_id),
  CONSTRAINT admin_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.brand_deposits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_user_id uuid NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'USD'::text,
  status text NOT NULL DEFAULT 'received'::text,
  txn_ref text,
  received_at timestamp with time zone DEFAULT now(),
  note text,
  CONSTRAINT brand_deposits_pkey PRIMARY KEY (id),
  CONSTRAINT brand_deposits_brand_user_id_fkey FOREIGN KEY (brand_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.brand_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  brand_name text NOT NULL,
  email text,
  company_description text,
  website_url text,
  logo_url text,
  industry text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT brand_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT brand_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.campaign_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campaign_id uuid,
  from_admin boolean DEFAULT false,
  message text NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT campaign_messages_pkey PRIMARY KEY (id),
  CONSTRAINT campaign_messages_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id)
);
CREATE TABLE public.campaign_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  campaign_id uuid NOT NULL,
  campaign_name text NOT NULL,
  video_url text NOT NULL,
  caption text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  submitted_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  review_notes text,
  CONSTRAINT campaign_submissions_pkey PRIMARY KEY (id),
  CONSTRAINT campaign_submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT campaign_submissions_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id),
  CONSTRAINT campaign_submissions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id)
);
CREATE TABLE public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  requirements ARRAY NOT NULL DEFAULT '{}'::text[],
  payout text NOT NULL,
  assets jsonb DEFAULT '[]'::jsonb,
  description text,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text, 'pending'::text, 'approved'::text, 'cancelled'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  image_url text,
  timeline text DEFAULT 'Flexible'::text,
  budget text,
  objectives text,
  quality_standard text,
  estimated_views integer,
  admin_feedback text,
  cancellation_requested boolean DEFAULT false,
  cancellation_reason text,
  approved_by uuid,
  approved_at timestamp without time zone,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  review_note text,
  CONSTRAINT campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT campaigns_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id),
  CONSTRAINT campaigns_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id),
  CONSTRAINT campaigns_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.creator_payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  campaign_id uuid,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'USD'::text,
  status text NOT NULL DEFAULT 'pending'::text,
  approved_by uuid,
  approved_at timestamp with time zone,
  paid_at timestamp with time zone,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT creator_payouts_pkey PRIMARY KEY (id),
  CONSTRAINT creator_payouts_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id),
  CONSTRAINT creator_payouts_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id),
  CONSTRAINT creator_payouts_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id)
);
CREATE TABLE public.creator_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  creator_name text NOT NULL,
  email text,
  bio text,
  niche text,
  profile_picture_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT creator_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT creator_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);