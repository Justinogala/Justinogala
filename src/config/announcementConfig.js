
import { Sparkles, Zap, Bell, Info, Gift, MessageSquare, FileCheck } from 'lucide-react';

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
  }
};
