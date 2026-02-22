
// This service handles RAG-based chat functionality

const EMBEDDINGS_API_URL = 'https://api.openai.com/v1/embeddings';
const COMPLETIONS_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Generates embeddings for a text string
 */
const getEmbedding = async (text, apiKey) => {
  const response = await fetch(EMBEDDINGS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: text,
      model: "text-embedding-ada-002"
    }),
  });

  if (!response.ok) throw new Error('Failed to generate embedding');
  const data = await response.json();
  return data.data[0].embedding;
};

/**
 * Simple cosine similarity function
 */
const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// In-memory store for embeddings (since we don't have a vector DB in this frontend-only scope)
// In a real app, this would be stored in Supabase pgvector or Pinecone
let documentChunks = [];

export const processTranscriptForChat = async (transcript, apiKey) => {
  // 1. Chunk the transcript
  const chunkSize = 1000; // characters
  const chunks = [];
  for (let i = 0; i < transcript.length; i += chunkSize) {
    chunks.push(transcript.slice(i, i + chunkSize));
  }

  // 2. Generate embeddings for chunks
  const processedChunks = await Promise.all(chunks.map(async (chunk) => {
    const embedding = await getEmbedding(chunk, apiKey);
    return { content: chunk, embedding };
  }));

  documentChunks = processedChunks;
  return true;
};

export const answerQuestion = async (question, chatHistory, apiKey) => {
  if (documentChunks.length === 0) {
    throw new Error("Transcript not processed yet.");
  }

  // 1. Embed question
  const questionEmbedding = await getEmbedding(question, apiKey);

  // 2. Find relevant chunks (Vector Search)
  const relevantChunks = documentChunks.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(questionEmbedding, chunk.embedding)
  }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 3); // Top 3 chunks

  const context = relevantChunks.map(c => c.content).join("\n---\n");

  // 3. Generate answer
  const messages = [
    {
      role: "system",
      content: `You are a helpful assistant answering questions about a meeting based ONLY on the provided context. 
      Context:
      ${context}
      
      If the answer is not in the context, say you don't know.`
    },
    ...chatHistory.slice(-4), // Include recent history for conversational context
    { role: "user", content: question }
  ];

  const response = await fetch(COMPLETIONS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: messages,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
};
