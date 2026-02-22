
export const SUBSCRIPTION_PLANS = [
  {
    id: 'plan_free',
    stripeProductId: 'prod_free_tier',
    name: 'Free',
    description: 'Perfect for getting started',
    price: {
      monthly: 0,
      yearly: 0
    },
    currency: 'USD',
    features: [
      { id: 'transcriptions', text: '5 Transcriptions/month', included: true },
      { id: 'audio_mins', text: '30 Minutes of audio/month', included: true },
      { id: 'storage', text: '1 GB Storage', included: true },
      { id: 'quality', text: 'Standard Quality', included: true },
      { id: 'export', text: 'Basic Export (TXT)', included: true },
      { id: 'support', text: 'Community Support', included: true }
    ],
    limits: {
      transcriptions: 5,
      audioMinutes: 30,
      storageGB: 1,
      apiCalls: 100
    },
    highlight: false,
    color: 'slate'
  },
  {
    id: 'plan_pro',
    stripeProductId: 'prod_pro_tier',
    name: 'Pro',
    description: 'For power users and creators',
    price: {
      monthly: 29,
      yearly: 290 // ~20% discount approx
    },
    currency: 'USD',
    features: [
      { id: 'transcriptions', text: '100 Transcriptions/month', included: true },
      { id: 'audio_mins', text: '500 Minutes of audio/month', included: true },
      { id: 'storage', text: '50 GB Storage', included: true },
      { id: 'quality', text: 'High Quality (Whisper Large)', included: true },
      { id: 'export', text: 'Advanced Export (PDF, DOCX, SRT)', included: true },
      { id: 'support', text: 'Priority Email Support', included: true }
    ],
    limits: {
      transcriptions: 100,
      audioMinutes: 500,
      storageGB: 50,
      apiCalls: 5000
    },
    highlight: true,
    color: 'indigo'
  },
  {
    id: 'plan_enterprise',
    stripeProductId: 'prod_ent_tier',
    name: 'Enterprise',
    description: 'For teams and organizations',
    price: {
      monthly: 99,
      yearly: 990 
    },
    currency: 'USD',
    features: [
      { id: 'transcriptions', text: 'Unlimited Transcriptions', included: true },
      { id: 'audio_mins', text: 'Unlimited Audio', included: true },
      { id: 'storage', text: 'Unlimited Storage', included: true },
      { id: 'quality', text: 'Highest Quality + Custom Models', included: true },
      { id: 'export', text: 'All Formats + API Access', included: true },
      { id: 'support', text: 'Dedicated Account Manager', included: true }
    ],
    limits: {
      transcriptions: 999999,
      audioMinutes: 999999,
      storageGB: 1024,
      apiCalls: 100000
    },
    highlight: false,
    color: 'purple'
  }
];

export const getPlanById = (id) => SUBSCRIPTION_PLANS.find(p => p.id === id) || SUBSCRIPTION_PLANS[0];

/* 
  SUPABASE SCHEMA MIGRATION REFERENCE
  -----------------------------------
  
  -- Users Table Extension
  alter table public.users 
  add column subscription_plan_id text default 'plan_free',
  add column stripe_customer_id text,
  add column subscription_status text default 'active', -- active, past_due, canceled, incomplete
  add column current_period_end timestamp with time zone,
  add column cancel_at_period_end boolean default false;

  -- Usage Metrics Table
  create table public.usage_metrics (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) not null,
    period_start timestamp with time zone not null,
    period_end timestamp with time zone not null,
    transcriptions_count integer default 0,
    audio_minutes_used float default 0,
    storage_used_gb float default 0,
    api_calls_count integer default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
  );

  -- Billing History Table
  create table public.billing_history (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) not null,
    amount integer not null, -- in cents
    currency text default 'usd',
    status text not null, -- paid, open, void, uncollectible
    invoice_url text,
    period_start timestamp with time zone,
    period_end timestamp with time zone,
    created_at timestamp with time zone default now()
  );
*/
