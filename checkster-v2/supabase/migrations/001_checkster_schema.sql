-- ============================================================================
-- Checkster — Supabase PostgreSQL Schema & Row-Level Security (RLS) Migration
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. Users
create table if not exists public.users (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null unique,
    password_hash text not null,
    phone text default '',
    role text not null check (role in ('homeowner', 'contractor', 'admin')) default 'homeowner',
    preferred_language text not null check (preferred_language in ('en', 'ur', 'roman_ur')) default 'en',
    city text default 'peshawar',
    neighbourhood text default '',
    created_at timestamptz not null default now()
);

-- 2. Inspections
create table if not exists public.inspections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.users(id) on delete set null,
    property_location text default '',
    city text default 'peshawar',
    neighbourhood text default '',
    room text default 'bedroom',
    area_sqft numeric default 40,
    issue_category text not null,
    description text default '',
    image_urls jsonb not null default '[]'::jsonb,
    initial_analysis_json jsonb default '{}'::jsonb,
    followup_answers_json jsonb default '{}'::jsonb,
    diagnosis_json jsonb default '{}'::jsonb,
    estimate_json jsonb default '{}'::jsonb,
    diagnosis text default '',
    severity text default 'moderate',
    confidence numeric default 0.0,
    status text not null check (status in (
        'draft', 'submitted', 'analysing', 'awaiting_answers',
        'diagnosis_ready', 'quote_uploaded', 'quote_audited',
        'repair_requested', 'completed'
    )) default 'draft',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 3. Inspection Evidence
create table if not exists public.inspection_evidence (
    id uuid primary key default gen_random_uuid(),
    inspection_id uuid not null references public.inspections(id) on delete cascade,
    observation text not null,
    image_reference text default '',
    evidence_type text default 'visual',
    confidence numeric default 0.0
);

-- 4. Inspection Recommendations
create table if not exists public.inspection_recommendations (
    id uuid primary key default gen_random_uuid(),
    inspection_id uuid not null references public.inspections(id) on delete cascade,
    repair_action text not null,
    trade text default 'general',
    materials jsonb default '[]'::jsonb,
    estimated_cost numeric default 0,
    safety_level text default 'professional_recommended',
    explanation text default '',
    step_order int default 1
);

-- 5. Quotations
create table if not exists public.quotations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.users(id) on delete set null,
    inspection_id uuid references public.inspections(id) on delete set null,
    contractor_name text default '',
    quote_date text default '',
    uploaded_file_url text default '',
    extracted_text text default '',
    quoted_total numeric,
    audited_total numeric default 0,
    audit_status text not null default 'extracted',
    findings_json jsonb default '[]'::jsonb,
    ai_explanation_json jsonb default '{}'::jsonb,
    created_at timestamptz not null default now()
);

-- 6. Quotation Line Items
create table if not exists public.quotation_line_items (
    id uuid primary key default gen_random_uuid(),
    quotation_id uuid not null references public.quotations(id) on delete cascade,
    description text not null,
    quantity numeric,
    unit text default '',
    unit_price numeric,
    total_price numeric,
    normalized_category text default 'other',
    reference_price numeric,
    variance numeric
);

-- 7. Contractors
create table if not exists public.contractors (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.users(id) on delete cascade,
    business_name text not null,
    owner_name text default '',
    phone text not null,
    email text default '',
    service_categories jsonb not null default '[]'::jsonb,
    experience_years int default 1,
    daily_rate numeric default 2000,
    description text default '',
    city text not null default 'peshawar',
    neighbourhood text default '',
    working_areas jsonb default '[]'::jsonb,
    address text default '',
    latitude numeric,
    longitude numeric,
    google_place_id text,
    profile_photo_url text default '',
    past_work_urls jsonb default '[]'::jsonb,
    verification_doc_url text default '',
    verification_notes text default '',
    is_available boolean default true,
    registration_status text not null check (registration_status in (
        'google_maps_listed', 'checkster_registered'
    )) default 'checkster_registered',
    verification_status text not null check (verification_status in (
        'pending', 'submitted', 'under_review', 'verified', 'rejected'
    )) default 'pending',
    created_at timestamptz not null default now()
);

-- 8. Contractor Reviews
create table if not exists public.contractor_reviews (
    id uuid primary key default gen_random_uuid(),
    contractor_id uuid not null references public.contractors(id) on delete cascade,
    user_id uuid not null references public.users(id) on delete cascade,
    user_name text default '',
    rating int not null check (rating between 1 and 5),
    review text default '',
    created_at timestamptz not null default now()
);

-- 9. Saved Contractors
create table if not exists public.saved_contractors (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    contractor_id uuid references public.contractors(id) on delete set null,
    google_place_id text,
    snapshot_json jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

-- 10. Repair Requests
create table if not exists public.repair_requests (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    inspection_id uuid references public.inspections(id) on delete set null,
    contractor_id uuid references public.contractors(id) on delete set null,
    trade text not null default 'plumber',
    title text not null,
    description text default '',
    city text default 'peshawar',
    neighbourhood text default '',
    offered_price numeric not null default 0,
    counter_price numeric,
    status text not null check (status in (
        'open', 'accepted', 'countered', 'rejected', 'scheduled', 'completed', 'cancelled'
    )) default 'open',
    scheduled_date text default '',
    created_at timestamptz not null default now()
);

-- 11. Price References
create table if not exists public.price_references (
    id text primary key,
    category text not null check (category in ('labour', 'material', 'equipment', 'transport', 'other')),
    item_name text not null,
    unit text not null,
    location text not null,
    rate numeric not null,
    rate_high numeric not null,
    source_name text not null,
    source_url text,
    effective_date text not null,
    last_verified_at text not null,
    source_type text not null check (source_type in ('official', 'market_observed', 'sample'))
);

-- Row-Level Security (RLS)
alter table public.users enable row level security;
alter table public.inspections enable row level security;
alter table public.quotations enable row level security;
alter table public.contractors enable row level security;
alter table public.repair_requests enable row level security;

create policy "Users can view own profile" on public.users
    for select using (auth.uid() = id);
create policy "Users can view own inspections" on public.inspections
    for all using (auth.uid() = user_id);
create policy "Users can view own quotations" on public.quotations
    for all using (auth.uid() = user_id);
create policy "Public can view contractors" on public.contractors
    for select using (true);
create policy "Contractors manage own record" on public.contractors
    for all using (auth.uid() = user_id);
