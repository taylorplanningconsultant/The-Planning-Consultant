-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  postcode text,
  source text NOT NULL CHECK (source = ANY (ARRAY['hero'::text, 'report_gate'::text, 'newsletter'::text])),
  report_id uuid,
  converted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT leads_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id)
);
CREATE TABLE public.lpa (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  lpa_code text NOT NULL UNIQUE,
  region text,
  website_url text,
  planning_portal_url text,
  local_plan_name text,
  local_plan_adopted_date date,
  article4_coverage text CHECK ((article4_coverage = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text, 'none'::text])) OR article4_coverage IS NULL),
  conservation_area_count integer,
  listed_building_count integer,
  green_belt_coverage boolean DEFAULT false,
  flood_risk_level text CHECK ((flood_risk_level = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text])) OR flood_risk_level IS NULL),
  average_decision_weeks integer,
  approval_rate_percent integer CHECK (approval_rate_percent IS NULL OR approval_rate_percent >= 0 AND approval_rate_percent <= 100),
  applications_per_year integer,
  pre_app_advice_offered boolean DEFAULT false,
  planning_email text,
  summary_paragraph text,
  key_policy_notes text,
  hero_image_url text,
  population integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lpa_pkey PRIMARY KEY (id)
);
CREATE TABLE public.professionals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  company_name text,
  professional_type text NOT NULL CHECK (professional_type = ANY (ARRAY['architect'::text, 'planning_agent'::text, 'developer'::text, 'surveyor'::text])),
  postcode text,
  coverage_radius_miles integer DEFAULT 25,
  active boolean DEFAULT true,
  stripe_subscription_id text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT professionals_pkey PRIMARY KEY (id),
  CONSTRAINT professionals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  full_name text,
  role text NOT NULL DEFAULT 'user'::text CHECK (role = ANY (ARRAY['user'::text, 'admin'::text])),
  subscription_tier text NOT NULL DEFAULT 'free'::text CHECK (subscription_tier = ANY (ARRAY['free'::text, 'starter'::text, 'pro'::text, 'agency'::text])),
  stripe_customer_id text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  address text NOT NULL,
  postcode text NOT NULL,
  lpa_name text,
  lpa_code text,
  constraint_data jsonb,
  approval_score integer CHECK (approval_score IS NULL OR approval_score >= 0 AND approval_score <= 100),
  report_type text NOT NULL DEFAULT 'basic'::text CHECK (report_type = ANY (ARRAY['basic'::text, 'full'::text])),
  pdf_url text,
  share_token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.statements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  report_id uuid,
  address text,
  proposal_text text NOT NULL,
  generated_content text,
  lpa_name text,
  status text NOT NULL DEFAULT 'draft'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT statements_pkey PRIMARY KEY (id),
  CONSTRAINT statements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT statements_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id)
);
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text NOT NULL CHECK (plan = ANY (ARRAY['starter'::text, 'pro'::text, 'agency'::text])),
  status text NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'cancelled'::text, 'past_due'::text])),
  current_period_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);