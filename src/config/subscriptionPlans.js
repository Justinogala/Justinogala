/**
 * Subscription Plans Configuration
 * 4-tier pricing: Free, Pro ($19), Business ($39), Enterprise ($79)
 */

export const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    stripeProductId: 'prod_free',
    name: 'Free',
    description: 'Perfect for individuals getting started',
    price: {
      monthly: 0,
      yearly: 0
    },
    currency: 'USD',
    features: [
      { id: 'meetings', text: '5 video meetings per month', included: true },
      { id: 'transcription', text: '30 minutes AI transcription', included: true },
      { id: 'storage', text: '1 GB secure cloud storage', included: true },
      { id: 'ai_transcription', text: 'Basic AI-powered transcription', included: true },
      { id: 'video_meetings', text: 'Instant video meetings with screen share', included: true },
      { id: 'chat', text: 'Team chat messaging', included: true },
      { id: 'calendar', text: 'Calendar & scheduling', included: true },
      { id: 'tts', text: 'Text-to-Audio conversion (basic)', included: true },
      { id: 'support', text: 'Email support', included: true }
    ],
    limits: {
      meetingsPerMonth: 5,
      transcriptionMinutes: 30,
      storageGB: 1,
      workspaces: 1,
      teamMembers: 1,
      videoDurationSeconds: 4
    },
    highlight: false,
    color: 'slate'
  },
  {
    id: 'pro',
    stripeProductId: 'prod_pro',
    name: 'Pro',
    description: 'Best for professionals & growing teams',
    price: {
      monthly: 19,
      yearly: 190
    },
    currency: 'USD',
    features: [
      { id: 'meetings', text: '50 video meetings per month', included: true },
      { id: 'transcription', text: '300 minutes AI transcription', included: true },
      { id: 'storage', text: '5 GB secure cloud storage', included: true },
      { id: 'ai_transcription', text: 'AI-powered transcription', included: true },
      { id: 'video_meetings', text: 'HD video meetings with recording', included: true },
      { id: 'chat', text: 'Team chat messaging', included: true },
      { id: 'voice_chat', text: 'Voice chat channels', included: true },
      { id: 'tts', text: 'Text-to-Audio conversion', included: true },
      { id: 'support', text: 'Priority email support', included: true },
      { id: 'speaker_id', text: 'Speaker identification', included: true },
      { id: 'workspaces', text: '3 team workspaces', included: true },
      { id: 'team', text: 'Up to 5 team members', included: true },
      { id: 'ttv', text: 'Text-to-Video (up to 8s)', included: true }
    ],
    limits: {
      meetingsPerMonth: 50,
      transcriptionMinutes: 300,
      storageGB: 5,
      workspaces: 3,
      teamMembers: 5,
      videoDurationSeconds: 8
    },
    highlight: true,
    color: 'indigo'
  },
  {
    id: 'business',
    stripeProductId: 'prod_business',
    name: 'Business',
    description: 'For growing teams and startups',
    price: {
      monthly: 39,
      yearly: 390
    },
    currency: 'USD',
    features: [
      { id: 'meetings', text: '150 video meetings per month', included: true },
      { id: 'transcription', text: '1000 minutes AI transcription', included: true },
      { id: 'storage', text: '25 GB secure cloud storage', included: true },
      { id: 'ai_transcription', text: 'Advanced AI transcription with speaker ID', included: true },
      { id: 'video_meetings', text: 'HD video meetings with recording', included: true },
      { id: 'screen_share', text: 'Screen sharing & collaboration', included: true },
      { id: 'chat', text: 'Unlimited team chat', included: true },
      { id: 'voice_chat', text: 'Voice chat channels', included: true },
      { id: 'support', text: 'Priority support', included: true },
      { id: 'ai_summaries', text: 'AI meeting summaries', included: true },
      { id: 'workspaces', text: '10 team workspaces', included: true },
      { id: 'team', text: 'Up to 25 team members', included: true },
      { id: 'ttv', text: 'Text-to-Video (up to 24s)', included: true },
      { id: 'multi_clip', text: 'Extended multi-clip video', included: true },
      { id: 'admin', text: 'Admin dashboard', included: true },
      { id: 'analytics', text: 'Advanced analytics', included: true },
      { id: 'integrations', text: 'Custom integrations', included: true }
    ],
    limits: {
      meetingsPerMonth: 150,
      transcriptionMinutes: 1000,
      storageGB: 25,
      workspaces: 10,
      teamMembers: 25,
      videoDurationSeconds: 24
    },
    highlight: false,
    color: 'violet'
  },
  {
    id: 'enterprise',
    stripeProductId: 'prod_enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: {
      monthly: 79,
      yearly: 790
    },
    currency: 'USD',
    features: [
      { id: 'meetings', text: 'Unlimited video meetings', included: true },
      { id: 'transcription', text: 'Unlimited AI transcription', included: true },
      { id: 'storage', text: '100 GB secure cloud storage', included: true },
      { id: 'ai_transcription', text: 'Enterprise-grade AI transcription', included: true },
      { id: 'video_meetings', text: '4K video meetings with recording', included: true },
      { id: 'screen_share', text: 'Screen sharing & virtual backgrounds', included: true },
      { id: 'chat', text: 'Unlimited team chat', included: true },
      { id: 'voice_chat', text: 'Voice chat channels', included: true },
      { id: 'support', text: '24/7 dedicated support', included: true },
      { id: 'ai_summaries', text: 'AI meeting summaries & insights', included: true },
      { id: 'workspaces', text: 'Unlimited workspaces', included: true },
      { id: 'team', text: 'Unlimited team members', included: true },
      { id: 'ttv', text: 'Text-to-Video (up to 60s)', included: true },
      { id: 'multi_clip', text: 'Extended multi-clip video', included: true },
      { id: 'admin', text: 'Full admin dashboard', included: true },
      { id: 'cloud_config', text: 'Cloud provider configuration', included: true },
      { id: 'branding', text: 'Custom branding', included: true },
      { id: 'sso', text: 'SSO/SAML integration', included: true },
      { id: 'account_manager', text: 'Dedicated account manager', included: true },
      { id: 'sla', text: 'SLA guarantee', included: true },
      { id: 'api', text: 'API access', included: true }
    ],
    limits: {
      meetingsPerMonth: -1,
      transcriptionMinutes: -1,
      storageGB: 100,
      workspaces: -1,
      teamMembers: -1,
      videoDurationSeconds: 60
    },
    highlight: false,
    color: 'purple'
  }
];

export const getPlanById = (id) => SUBSCRIPTION_PLANS.find(p => p.id === id) || SUBSCRIPTION_PLANS[0];

export const getPlanByStripeProductId = (stripeProductId) => 
  SUBSCRIPTION_PLANS.find(p => p.stripeProductId === stripeProductId) || SUBSCRIPTION_PLANS[0];

export const formatLimit = (value) => {
  if (value === -1 || value === 'Unlimited') return 'Unlimited';
  return value;
};
