
import jsPDF from 'jspdf';
import { v4 as uuidv4 } from 'uuid';
import { analyticsService } from './analyticsService';
import { usageStatisticsService } from './usageStatisticsService';
import { transcriptionAnalyticsService } from './transcriptionAnalyticsService';
import { paymentAnalyticsService } from './paymentAnalyticsService';

const REPORTS_KEY = 'munal_generated_reports';

const getReports = () => {
    try {
        return JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
    } catch {
        return [];
    }
};

const saveReports = (reports) => {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
};

export const reportGenerationService = {
    getAllReports: () => {
        return getReports().sort((a,b) => new Date(b.generatedAt) - new Date(a.generatedAt));
    },

    deleteReport: (id) => {
        const reports = getReports();
        const filtered = reports.filter(r => r.id !== id);
        saveReports(filtered);
    },

    generateReport: async (type, dateRange = 'last_30_days') => {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1500));

        let data = {};
        let title = '';

        switch (type) {
            case 'usage':
                data = usageStatisticsService.getOverviewStats();
                title = 'Usage Statistics Report';
                break;
            case 'transcription':
                data = transcriptionAnalyticsService.getMetrics();
                title = 'Transcription Analysis Report';
                break;
            case 'financial':
                data = paymentAnalyticsService.getFinancialMetrics();
                title = 'Financial & Revenue Report';
                break;
            default:
                data = { info: 'General overview' };
                title = 'General Analytics Report';
        }

        const reportId = uuidv4();
        const report = {
            id: reportId,
            title,
            type,
            dateRange,
            generatedAt: new Date().toISOString(),
            status: 'completed',
            dataSummary: data
        };

        const reports = getReports();
        reports.push(report);
        saveReports(reports);

        return report;
    },

    exportToPDF: (report) => {
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text(report.title, 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, 20, 30);
        doc.text(`Period: ${report.dateRange}`, 20, 38);
        
        doc.setLineWidth(0.5);
        doc.line(20, 45, 190, 45);
        
        let y = 60;
        doc.setFontSize(14);
        doc.text("Key Metrics:", 20, y);
        y += 10;
        
        doc.setFontSize(12);
        Object.entries(report.dataSummary).forEach(([key, value]) => {
            if (typeof value === 'object') {
                doc.text(`${key}: [Complex Data]`, 20, y);
            } else {
                doc.text(`${key}: ${value}`, 20, y);
            }
            y += 10;
        });

        doc.save(`${report.title.replace(/\s+/g, '_')}_${report.generatedAt.split('T')[0]}.pdf`);
    },

    emailReport: async (reportId, email) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`[ReportService] Emailing report ${reportId} to ${email}`);
        return { success: true };
    }
};
