
import { analyticsService } from './analyticsService';

const USERS_KEY = 'munal_users';

const getUsers = () => {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    } catch {
        return [];
    }
};

export const usageStatisticsService = {
    getOverviewStats: () => {
        const users = getUsers();
        const events = analyticsService.getAllEvents();
        const now = new Date();
        
        // Active in last 30 days
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        
        const activeUserIds = new Set(
            events
                .filter(e => new Date(e.timestamp) >= thirtyDaysAgo && e.userId)
                .map(e => e.userId)
        );

        return {
            totalUsers: users.length,
            activeUsers: activeUserIds.size,
            totalEvents: events.length
        };
    },

    getDAU: () => {
        // Daily Active Users (Mock calculation based on login events today)
        const events = analyticsService.getAllEvents();
        const today = new Date().toISOString().split('T')[0];
        
        const dailyUsers = new Set(
            events
                .filter(e => e.timestamp.startsWith(today) && e.userId)
                .map(e => e.userId)
        );
        return dailyUsers.size;
    },

    getMAU: () => {
         // Monthly Active Users
         return usageStatisticsService.getOverviewStats().activeUsers;
    },

    getStorageUsage: () => {
        // Mock storage usage calculation
        // In a real app, this would sum up file sizes from a file service
        return {
            usedBytes: 1024 * 1024 * 450, // 450 MB mock
            totalBytes: 1024 * 1024 * 1024 * 5, // 5 GB limit
            percentage: 9
        };
    },
    
    getFeatureUsage: () => {
        const events = analyticsService.getAllEvents();
        const featureCounts = {};
        
        events.forEach(e => {
            if (e.event.startsWith('feature_use_')) {
                const feature = e.event.replace('feature_use_', '');
                featureCounts[feature] = (featureCounts[feature] || 0) + 1;
            }
        });
        
        return Object.entries(featureCounts).map(([name, count]) => ({ name, count }));
    }
};
