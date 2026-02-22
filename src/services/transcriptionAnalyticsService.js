
// Mocking transcription data since the actual service isn't accessible to read from this context
const TRANSCRIPTIONS_KEY = 'munal_transcriptions';

const getTranscriptions = () => {
    try {
        // Fallback to empty array if key doesn't exist, normally would read from transcriptionService's storage
        return JSON.parse(localStorage.getItem(TRANSCRIPTIONS_KEY) || '[]');
    } catch {
        return [];
    }
};

export const transcriptionAnalyticsService = {
    getTotalTranscriptions: () => {
        return getTranscriptions().length;
    },

    getMetrics: () => {
        const txs = getTranscriptions();
        
        // Calculate total duration (assuming duration is stored in seconds)
        const totalDurationSeconds = txs.reduce((acc, curr) => acc + (curr.duration || 0), 0);
        const totalDurationHours = (totalDurationSeconds / 3600).toFixed(1);

        // Language breakdown
        const languages = {};
        txs.forEach(t => {
            const lang = t.language || 'Unknown';
            languages[lang] = (languages[lang] || 0) + 1;
        });

        // Mock Cost (e.g., $0.02 per minute)
        const totalCost = ((totalDurationSeconds / 60) * 0.02).toFixed(2);
        
        // Mock Accuracy (average of stored confidence scores or default 95%)
        const avgAccuracy = txs.length > 0 
            ? (txs.reduce((acc, curr) => acc + (curr.accuracy || 95), 0) / txs.length).toFixed(1)
            : 0;

        return {
            totalCount: txs.length,
            totalDurationHours,
            languages,
            totalCost,
            avgAccuracy
        };
    },

    getTrends: (days = 7) => {
        // Mock trend data generation
        const trends = [];
        const now = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            trends.push({
                date: date.toISOString().split('T')[0],
                count: Math.floor(Math.random() * 20), // Mock daily count
                minutes: Math.floor(Math.random() * 120) // Mock daily minutes
            });
        }
        return trends;
    }
};
