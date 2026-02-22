export const aiResponses = [
  {
    category: 'greetings',
    keywords: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'],
    response: "Hello! I'm EchoNote's AI assistant. How can I help you today? I can answer questions about features, pricing, or help you with your account."
  },
  {
    category: 'features',
    keywords: ['features', 'what can you do', 'capabilities', 'transcribe', 'summary', 'recording'],
    response: "EchoNote AI offers powerful features including: \n• Real-time meeting transcription\n• AI-powered summaries and action items\n• Sentiment analysis\n• Team collaboration workspaces\n• Secure cloud storage for recordings"
  },
  {
    category: 'pricing',
    keywords: ['price', 'cost', 'subscription', 'plan', 'free', 'premium', 'enterprise'],
    response: "We offer three main tiers:\n• Free: Basic transcription for individuals (up to 30 mins/month)\n• Pro: Advanced AI insights & unlimited meetings ($12/month)\n• Enterprise: Custom security, SSO & dedicated support (Contact sales)"
  },
  {
    category: 'account',
    keywords: ['account', 'login', 'sign in', 'password', 'reset', 'delete account'],
    response: "You can manage your account settings from the Profile page. If you need to reset your password, click 'Forgot Password' on the login screen. For account deletion, please contact support."
  },
  {
    category: 'support',
    keywords: ['help', 'support', 'contact', 'email', 'phone', 'bug', 'issue'],
    response: "Our support team is here to help! You can reach us at support@echonote.ai or check our Documentation page for detailed guides."
  },
  {
    category: 'security',
    keywords: ['secure', 'security', 'privacy', 'data', 'gdpr', 'encrypt'],
    response: "Security is our top priority. All data is encrypted at rest and in transit using AES-256. We are SOC2 compliant and never share your data with third parties without consent."
  },
  {
    category: 'integrations',
    keywords: ['zoom', 'teams', 'google meet', 'slack', 'integration', 'connect'],
    response: "EchoNote AI integrates seamlessly with Zoom, Google Meet, and Microsoft Teams. You can also connect your Slack workspace to receive summary notifications directly in your channels."
  },
  {
    category: 'fallback',
    keywords: [],
    response: "I'm not sure I understand that specific query. Could you try rephrasing? I can help with features, pricing, account management, and general support."
  }
];

export const findResponse = (input) => {
  const lowercaseInput = input.toLowerCase();
  
  // Find the first matching category
  const match = aiResponses.find(item => 
    item.keywords.some(keyword => lowercaseInput.includes(keyword))
  );

  return match ? match.response : aiResponses.find(r => r.category === 'fallback').response;
};