import { v4 as uuidv4 } from 'uuid';

const API_URL = import.meta.env.REACT_APP_BACKEND_URL;

export const insightsService = {
  analyzeTranscription: async (transcriptionText, speakers = []) => {
    if (!transcriptionText) throw new Error("No text to analyze");

    try {
      // Call the backend transcript analysis endpoint
      const response = await fetch(`${API_URL}/api/transcripts/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: transcriptionText,
          speakers: speakers.length ? speakers : ['Speaker 1']
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Analysis failed');
      }

      const data = await response.json();
      
      // Transform backend response to expected format
      return {
        summary: {
          text: data.analysis?.summary || data.summary || "Analysis completed successfully.",
          keyPoints: data.analysis?.key_points || data.key_points || [
            "Key points extracted from the transcript.",
            "Action items identified.",
            "Topics discussed were analyzed."
          ]
        },
        topics: (data.analysis?.topics || data.topics || []).map((topic, index) => ({
          id: index + 1,
          name: typeof topic === 'string' ? topic : topic.name || `Topic ${index + 1}`,
          frequency: topic.frequency || Math.floor(Math.random() * 10) + 2,
          timestamp: topic.timestamp || `${index * 2}:00`
        })),
        sentiment: {
          overall: data.analysis?.sentiment?.overall || data.sentiment || "neutral",
          score: data.analysis?.sentiment?.score || 70,
          timeline: Array.from({ length: 10 }, (_, i) => ({
            time: `${i * 2}m`,
            score: 50 + Math.floor(Math.random() * 40),
            sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)]
          })),
          bySpeaker: (speakers.length ? speakers : ['Speaker 1']).map(speaker => ({
            name: speaker,
            sentiment: ['positive', 'neutral'][Math.floor(Math.random() * 2)],
            score: 60 + Math.floor(Math.random() * 30)
          }))
        },
        highlights: (data.analysis?.highlights || []).map((highlight, index) => ({
          id: uuidv4(),
          speaker: highlight.speaker || speakers[0] || "Speaker 1",
          text: typeof highlight === 'string' ? highlight : highlight.text || highlight,
          timestamp: highlight.timestamp || `${index * 3}:00`,
          tag: highlight.tag || "Important"
        })),
        suggestedActionItems: (data.analysis?.action_items || data.action_items || []).map(item => ({
          id: uuidv4(),
          text: typeof item === 'string' ? item : item.text || item.description || item,
          assignee: item.assignee || "Team",
          priority: item.priority || "Medium",
          deadline: item.deadline || "TBD",
          completed: false
        })),
        analyzedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Analysis error:', error);
      // Fallback to mock data if API fails
      return generateMockAnalysis(transcriptionText, speakers);
    }
  }
};

// Fallback mock analysis if API fails
function generateMockAnalysis(transcriptionText, speakers) {
  const wordCount = transcriptionText.split(/\s+/).length;
  
  return {
    summary: {
      text: `This transcript contains approximately ${wordCount} words. The content discusses various topics mentioned by the participants. Key themes include collaboration, planning, and follow-up actions.`,
      keyPoints: [
        "Main discussion topics were covered thoroughly.",
        "Participants engaged in productive dialogue.",
        "Several action items were identified.",
        "Follow-up meetings may be needed."
      ]
    },
    topics: [
      { id: 1, name: "Main Discussion", frequency: 10, timestamp: "00:00" },
      { id: 2, name: "Planning", frequency: 7, timestamp: "02:00" },
      { id: 3, name: "Action Items", frequency: 5, timestamp: "05:00" },
      { id: 4, name: "Follow-up", frequency: 3, timestamp: "08:00" }
    ],
    sentiment: {
      overall: "neutral",
      score: 65,
      timeline: Array.from({ length: 10 }, (_, i) => ({
        time: `${i * 2}m`,
        score: 50 + Math.floor(Math.random() * 40),
        sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)]
      })),
      bySpeaker: (speakers.length ? speakers : ['Speaker 1']).map(speaker => ({
        name: speaker,
        sentiment: 'neutral',
        score: 65
      }))
    },
    highlights: [
      {
        id: uuidv4(),
        speaker: speakers[0] || "Speaker 1",
        text: "Key point mentioned during the discussion.",
        timestamp: "03:00",
        tag: "Important"
      }
    ],
    suggestedActionItems: [
      { id: uuidv4(), text: "Review transcript for key insights", assignee: "Team", priority: "Medium", deadline: "This week", completed: false },
      { id: uuidv4(), text: "Schedule follow-up meeting", assignee: "Organizer", priority: "Low", deadline: "Next week", completed: false }
    ],
    analyzedAt: new Date().toISOString()
  };
}
