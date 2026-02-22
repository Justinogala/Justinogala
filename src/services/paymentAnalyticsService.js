
const USERS_KEY = 'munal_users';

export const paymentAnalyticsService = {
    getFinancialMetrics: () => {
        // In a real app, this reads from a 'payments' or 'subscriptions' table
        // Here we derive potential MRR from user plans
        
        let users = [];
        try {
            users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        } catch { users = []; }

        const planPrices = {
            'free': 0,
            'pro': 29,
            'team': 99,
            'enterprise': 499
        };

        let totalRevenue = 0;
        const revenueByPlan = { 'free': 0, 'pro': 0, 'team': 0, 'enterprise': 0 };
        const subCounts = { 'free': 0, 'pro': 0, 'team': 0, 'enterprise': 0 };

        users.forEach(u => {
            const plan = u.plan || 'free';
            const price = planPrices[plan] || 0;
            totalRevenue += price;
            revenueByPlan[plan] = (revenueByPlan[plan] || 0) + price;
            subCounts[plan] = (subCounts[plan] || 0) + 1;
        });

        // Mock Churn Rate (hardcoded for demo)
        const churnRate = 2.4; 

        // Mock LTV (Average Revenue Per User / Churn Rate)
        const arpu = users.length ? totalRevenue / users.length : 0;
        const ltv = arpu / (churnRate / 100);

        return {
            totalRevenue, // MRR
            revenueByPlan,
            subscriptionCount: users.length,
            planDistribution: subCounts,
            churnRate,
            ltv: ltv.toFixed(2)
        };
    },

    getRevenueTrends: () => {
        // Mock data for the last 6 months
        return [
            { month: 'Jan', revenue: 1200 },
            { month: 'Feb', revenue: 1450 },
            { month: 'Mar', revenue: 1300 },
            { month: 'Apr', revenue: 1800 },
            { month: 'May', revenue: 2100 },
            { month: 'Jun', revenue: 2450 },
        ];
    }
};
