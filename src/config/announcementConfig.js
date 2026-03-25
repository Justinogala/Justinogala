
import { Sparkles, Zap, Bell, Info, Gift, MessageSquare, FileCheck, Video, BarChart3, Shield, Mic, Briefcase, Clock } from 'lucide-react';

export const announcementTemplates = {
  welcome: {
    id: 'welcome-banner-v1',
    type: 'promotional',
    icon: Sparkles,
    headline: "Welcome to Munal",
    subtext: "Your ultimate AI meeting companion is here.",
    buttonText: "Explore Features",
    buttonLink: "/features/overview",
  },
  maintenance: {
    id: 'maintenance-warning',
    type: 'warning',
    icon: Info,
    headline: "Scheduled Maintenance",
    subtext: "System will be updated on Saturday at 2 AM UTC.",
    buttonText: "Status Page",
    buttonLink: "/status",
  },
  newFeature: {
    id: 'feature-voice-chat',
    type: 'info',
    icon: Zap,
    headline: "New: Voice Chat",
    subtext: "Interact with your meeting notes using just your voice!",
    buttonText: "Try Now",
    buttonLink: "/features/voice-chat",
  },
  promo: {
    id: 'promo-pro-plan',
    type: 'success',
    icon: Gift,
    headline: "Limited Offer",
    subtext: "Get 50% off the Pro plan for your first 3 months.",
    buttonText: "Claim Offer",
    buttonLink: "/pricing",
  }
};

// Rotating announcements for the top banner
export const rotatingAnnouncements = [
  {
    type: 'promotional',
    icon: Sparkles,
    headline: "Welcome to Munal",
    subtext: "Your all-in-one AI-powered workforce platform is here.",
    buttonText: "Explore Features",
    buttonLink: "/features/overview",
  },
  {
    type: 'info',
    icon: MessageSquare,
    headline: "Real-Time Team Chat",
    subtext: "Collaborate with your team through instant messaging, voice calls & file sharing.",
    buttonText: "Start Chatting",
    buttonLink: "/signup",
  },
  {
    type: 'success',
    icon: FileCheck,
    headline: "eSignatures & Smart Forms",
    subtext: "Go paperless with digital signatures, approvals & automated workflows.",
    buttonText: "Get Started",
    buttonLink: "/signup",
  },
  {
    type: 'meeting',
    icon: Video,
    headline: "AI-Powered Meetings",
    subtext: "Record, transcribe & summarize meetings automatically with smart AI assistance.",
    buttonText: "Try Meetings",
    buttonLink: "/signup",
  },
  {
    type: 'analytics',
    icon: BarChart3,
    headline: "Live Team Analytics",
    subtext: "Track activity in real-time with dashboards, graphs & performance insights.",
    buttonText: "See Dashboard",
    buttonLink: "/signup",
  },
  {
    type: 'security',
    icon: Shield,
    headline: "Enterprise-Grade Security",
    subtext: "Role-based access, audit logs & workspace isolation to keep your data safe.",
    buttonText: "Learn More",
    buttonLink: "/features/overview",
  },
  {
    type: 'voice',
    icon: Mic,
    headline: "Voice Notes & Transcription",
    subtext: "Record voice memos, transcribe audio to text & search your spoken ideas instantly.",
    buttonText: "Try It Free",
    buttonLink: "/signup",
  },
  {
    type: 'workspace',
    icon: Briefcase,
    headline: "Unified Workspaces",
    subtext: "Bring teams, projects & departments together under one roof with smart workspace management.",
    buttonText: "Create Workspace",
    buttonLink: "/signup",
  },
  {
    type: 'shifts',
    icon: Clock,
    headline: "Shift Scheduling & Time Tracking",
    subtext: "Plan shifts, track hours & manage attendance — all automated and conflict-free.",
    buttonText: "Explore Shifts",
    buttonLink: "/signup",
  },
];

// Default configuration to be used in the app
export const currentAnnouncement = announcementTemplates.welcome;

export const getAnnouncementStyle = (type) => {
  switch (type) {
    case 'warning':
      return {
        background: 'bg-gradient-to-r from-amber-500 to-orange-600',
        text: 'text-white',
        button: 'bg-white text-orange-600 hover:bg-orange-50'
      };
    case 'success':
      return {
        background: 'bg-gradient-to-r from-green-600 to-emerald-600',
        text: 'text-white',
        button: 'bg-white text-emerald-600 hover:bg-emerald-50'
      };
    case 'info':
      return {
        background: 'bg-gradient-to-r from-blue-600 to-cyan-600',
        text: 'text-white',
        button: 'bg-white text-blue-600 hover:bg-blue-50'
      };
    case 'promotional':
    default:
      return {
        background: 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600',
        text: 'text-white',
        button: 'bg-white text-violet-600 hover:bg-violet-50'
      };
    case 'meeting':
      return {
        background: 'bg-gradient-to-r from-rose-600 to-red-500',
        text: 'text-white',
        button: 'bg-white text-rose-600 hover:bg-rose-50'
      };
    case 'analytics':
      return {
        background: 'bg-gradient-to-r from-indigo-600 to-violet-500',
        text: 'text-white',
        button: 'bg-white text-indigo-600 hover:bg-indigo-50'
      };
    case 'security':
      return {
        background: 'bg-gradient-to-r from-slate-700 to-slate-900',
        text: 'text-white',
        button: 'bg-white text-slate-700 hover:bg-slate-50'
      };
    case 'voice':
      return {
        background: 'bg-gradient-to-r from-pink-600 to-fuchsia-600',
        text: 'text-white',
        button: 'bg-white text-pink-600 hover:bg-pink-50'
      };
    case 'workspace':
      return {
        background: 'bg-gradient-to-r from-amber-500 to-orange-600',
        text: 'text-white',
        button: 'bg-white text-amber-600 hover:bg-amber-50'
      };
    case 'shifts':
      return {
        background: 'bg-gradient-to-r from-teal-600 to-cyan-600',
        text: 'text-white',
        button: 'bg-white text-teal-600 hover:bg-teal-50'
      };
  }
};
