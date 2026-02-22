
// Mock analytics data generator

export const getUsageMetrics = async (dateRange = '7d') => {
  await new Promise(r => setTimeout(r, 600));
  
  // Simulate data based on range
  const days = dateRange === '30d' ? 30 : 7;
  const labels = Array.from({length: days}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  });

  return {
    transcriptionVolume: {
      total: 45200,
      trend: labels.map(() => Math.floor(Math.random() * 500) + 1000),
      labels
    },
    activeUsers: {
      total: 1250,
      trend: labels.map(() => Math.floor(Math.random() * 50) + 800),
      labels
    },
    apiCalls: {
      total: 154000,
      byEndpoint: [
        { name: '/transcribe', value: 45 },
        { name: '/chat', value: 30 },
        { name: '/summary', value: 15 },
        { name: '/auth', value: 10 }
      ]
    },
    costs: {
      total: 520.45,
      breakdown: [
        { name: 'OpenAI', value: 350.20 },
        { name: 'Storage', value: 120.50 },
        { name: 'Compute', value: 49.75 }
      ]
    }
  };
};
