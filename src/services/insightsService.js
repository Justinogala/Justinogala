
import { v4 as uuidv4 } from 'uuid';

// Mock service to simulate AI analysis
// In a real app, this would call an API (OpenAI, Anthropic, etc.)

const generateSentiment = () => {
  const sentiments = ['positive', 'neutral', 'negative'];
  return sentiments[Math.floor(Math.random() * sentiments.length)];
};

const getRandomScore = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const insightsService = {
  analyzeTranscription: async (transcriptionText, speakers = []) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (!transcriptionText) throw new Error("No text to analyze");

    // Mock Analysis Data
    const summary = {
      text: "The meeting focused on the Q3 product roadmap and the integration of new AI features. The team discussed the timeline for the 'Smart Insights' launch, identifying potential bottlenecks in the backend infrastructure. It was agreed that the design team needs to finalize the UI components by next Friday to keep the development schedule on track.",
      keyPoints: [
        "Q3 Product Roadmap finalized with a focus on AI integration.",
        "Smart Insights feature launch scheduled for mid-October.",
        "Backend infrastructure requires optimization before scale.",
        "Design team deadline set for next Friday."
      ]
    };

    const topics = [
      { id: 1, name: "Product Roadmap", frequency: 15, timestamp: "00:45" },
      { id: 2, name: "AI Features", frequency: 12, timestamp: "02:30" },
      { id: 3, name: "Backend Infrastructure", frequency: 8, timestamp: "05:15" },
      { id: 4, name: "UI/UX Design", frequency: 6, timestamp: "08:20" },
      { id: 5, name: "Marketing Strategy", frequency: 4, timestamp: "12:10" }
    ];

    const sentiment = {
      overall: "positive",
      score: 78, // 0-100
      timeline: Array.from({ length: 10 }, (_, i) => ({
        time: `${i * 2}m`,
        score: getRandomScore(40, 90),
        sentiment: generateSentiment()
      })),
      bySpeaker: (speakers.length ? speakers : ['Speaker A', 'Speaker B']).map(speaker => ({
        name: speaker,
        sentiment: generateSentiment(),
        score: getRandomScore(50, 95)
      }))
    };

    const highlights = [
      {
        id: uuidv4(),
        speaker: speakers[0] || "Speaker A",
        text: "We need to ensure the backend can handle the increased load from the new AI models.",
        timestamp: "05:15",
        tag: "Important"
      },
      {
        id: uuidv4(),
        speaker: speakers[1] || "Speaker B",
        text: "The new UI components are looking great, but we need to verify accessibility compliance.",
        timestamp: "08:45",
        tag: "Actionable"
      },
      {
        id: uuidv4(),
        speaker: speakers[0] || "Speaker A",
        text: "Let's aim for a soft launch in the first week of October to gather early feedback.",
        timestamp: "14:20",
        tag: "Decision"
      }
    ];

    // Note: Action Items are usually handled by a separate service or the same one. 
    // We'll return some mock ones here too if needed, but ActionItemsPanel often manages its own.
    const suggestedActionItems = [
      { id: uuidv4(), text: "Finalize UI components", assignee: "Design Team", priority: "High", deadline: "Next Friday", completed: false },
      { id: uuidv4(), text: "Optimize backend for AI load", assignee: "Dev Team", priority: "High", deadline: "Oct 1st", completed: false },
      { id: uuidv4(), text: "Schedule marketing sync", assignee: "Sarah", priority: "Medium", deadline: "Tomorrow", completed: false }
    ];

    return {
      summary,
      topics,
      sentiment,
      highlights,
      suggestedActionItems,
      analyzedAt: new Date().toISOString()
    };
  }
};
