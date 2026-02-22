
import { v4 as uuidv4 } from 'uuid';

// Mock data for fallback/demo purposes
const MOCK_INSIGHTS = {
  summary: "The meeting focused on the Q3 product roadmap and the integration of new AI features. The team agreed to prioritize the 'Smart Summary' feature over the 'Video Analysis' due to customer demand. There was a consensus on the need for better mobile responsiveness in the dashboard.",
  keyDecisions: [
    "Prioritize 'Smart Summary' feature for Q3 release.",
    "Postpone 'Video Analysis' to Q4.",
    "Allocate two dedicated engineers to mobile optimization.",
    "Adopt the new design system for all upcoming UI components."
  ],
  contextPoints: [
    "Customer feedback indicates a 40% drop-off on mobile devices.",
    "Competitor X recently launched a similar summary feature.",
    "The engineering team is currently at 80% capacity.",
    "Marketing needs the new features ready by September 15th."
  ]
};

export const smartInsightsService = {
  /**
   * Generates AI insights from transcription text.
   * In a real app, this would call OpenAI's API.
   * For this frontend-only demo, we'll simulate a call or allow for an API key.
   */
  generateInsights: async (transcriptionText, apiKey = null) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // If we had a real backend or API key integration, we would call it here.
    // Example:
    // if (apiKey) { return callOpenAI(transcriptionText, apiKey); }

    // For now, return mock data mixed with some analysis of the text length/content if possible
    // or just return the static mock for stability in this demo environment.
    
    return {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      ...MOCK_INSIGHTS
    };
  },

  /**
   * Regenerates specific sections of insights.
   */
  regenerateSection: async (section, transcriptionText) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return a slightly different variation for demo effect
    if (section === 'summary') {
      return "The team discussed Q3 goals, emphasizing the 'Smart Summary' launch. Mobile responsiveness was identified as a critical fix needed before the marketing push in September.";
    }
    return MOCK_INSIGHTS[section]; // Fallback to original mock
  }
};
