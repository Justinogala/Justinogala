
export const gptSummarizationService = {
  summarizeText: async (text, apiKey, style = 'standard') => {
    if (!apiKey) throw new Error("OpenAI API Key is missing");

    let prompt = "";
    switch (style) {
      case 'brief':
        prompt = "Summarize the following text in 1-2 concise sentences.";
        break;
      case 'detailed':
        prompt = "Provide a detailed summary of the following text in a full paragraph, capturing all main nuances.";
        break;
      case 'standard':
      default:
        prompt = "Summarize the following text in 3-5 clear sentences.";
        break;
    }

    const messages = [
      { role: "system", content: "You are a helpful assistant that summarizes meeting transcripts." },
      { role: "user", content: `${prompt}\n\nText:\n${text.substring(0, 15000)}` } // Truncate to avoid context limit issues roughly
    ];

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: messages,
          temperature: 0.5,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "GPT Summarization failed");
      }

      const data = await response.json();
      const content = data.choices[0].message.content.trim();

      return {
        summary: content,
        tokensUsed: data.usage.total_tokens,
        processingTime: 'N/A' // Not provided by API directly
      };
    } catch (error) {
      console.error("GPT Summarization Error:", error);
      throw error;
    }
  },

  generateKeyPoints: async (text, apiKey) => {
    if (!apiKey) throw new Error("OpenAI API Key is missing");

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "Extract key points from the text." },
            { role: "user", content: `Extract 5-7 key points from this text:\n\n${text.substring(0, 15000)}` }
          ],
          temperature: 0.5
        })
      });

      if (!response.ok) throw new Error("GPT Key Points generation failed");

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Basic parsing assuming list format
      const points = content.split('\n').filter(line => line.trim().match(/^[-*\d]/)).map(line => line.replace(/^[-*\d.]\s*/, ''));

      return {
        keyPoints: points.length > 0 ? points : [content],
        tokensUsed: data.usage.total_tokens
      };
    } catch (error) {
      console.error("GPT Key Points Error:", error);
      throw error;
    }
  },

  generateActionItems: async (text, apiKey) => {
    if (!apiKey) throw new Error("OpenAI API Key is missing");

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "Extract action items. Return as JSON array of objects with 'item', 'owner', 'deadline' fields." },
            { role: "user", content: `Identify action items from this meeting transcript:\n\n${text.substring(0, 15000)}` }
          ],
          temperature: 0.3
        })
      });

      if (!response.ok) throw new Error("GPT Action Items generation failed");

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Try to parse JSON, fallback to text splitting if LLM didn't return strict JSON
      let items = [];
      try {
        // Find JSON array in text
        const jsonMatch = content.match(/\[.*\]/s);
        if (jsonMatch) {
          items = JSON.parse(jsonMatch[0]);
        } else {
           items = content.split('\n').filter(l => l.length > 5).map(l => ({ item: l, owner: 'Unknown', deadline: 'TBD' }));
        }
      } catch (e) {
        items = [{ item: content, owner: '', deadline: '' }];
      }

      return {
        actionItems: items,
        tokensUsed: data.usage.total_tokens
      };
    } catch (error) {
      console.error("GPT Action Items Error:", error);
      throw error;
    }
  }
};
