
import { analyticsService } from './analyticsService';

export const userEngagementService = {
    getEngagementMetrics: () => {
        const events = analyticsService.getAllEvents();
        
        // Calculate login frequency (logins per day per user)
        const logins = events.filter(e => e.event === 'user_login');
        const uniqueUsers = new Set(logins.map(e => e.userId)).size;
        const avgLoginsPerUser = uniqueUsers ? (logins.length / uniqueUsers).toFixed(1) : 0;

        // Feature adoption (users who used feature X / total users)
        // Simplified mock adoption score
        const adoptionRate = 65; // 65%

        // NPS Score (Mock)
        const nps = 42;

        return {
            avgLoginsPerUser,
            adoptionRate,
            nps,
            satisfactionScore: 4.5 // out of 5
        };
    },

    getUserSegments: () => {
        // Mock segments
        return [
            { name: 'Power Users', count: 12, percentage: 15 },
            { name: 'Regulars', count: 45, percentage: 55 },
            { name: 'At Risk', count: 15, percentage: 18 },
            { name: 'Inactive', count: 10, percentage: 12 }
        ];
    }
};
